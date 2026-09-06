// src/components/PaystackPayment.jsx
import React, { useState, useRef, useCallback } from "react";
import {
  View,
  ActivityIndicator,
  Text,
  Alert,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Platform,
} from "react-native";
import { WebView } from "react-native-webview";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import api from "../src/api"; // uses your app's axios instance (keep your import path if different)

export default function PaystackPayment({
  paymentUrl,
  orderId = null,
  paymentReference = null,
  callbackHost = null,
  onSuccess = null,
  onClose = null,
}) {
  const [loading, setLoading] = useState(false);
  const [showLocalSuccess, setShowLocalSuccess] = useState(false);
  const successHandledRef = useRef(false); // prevent double-calls
  const webviewRef = useRef(null);

  const TOOLBAR_HEIGHT = 56; // used to reserve space so WebView content isn't blocked

  if (!paymentUrl) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Payment URL is missing.</Text>
      </View>
    );
  }

  // Primary verification function used when we detect a success in the webview.
  // It posts to /main/payment/verify/ first, and on 404 will try /main/payment/ as a fallback.
  const safeAutoVerify = useCallback(
    async (referenceToVerify) => {
      if (!referenceToVerify) return;

      // If caller provided onSuccess, prefer it (caller may perform its own verify flow)
      if (onSuccess) {
        try {
          await onSuccess({ reference: referenceToVerify, orderId });
        } catch (e) {
          console.warn("Error in caller onSuccess:", e);
        }
        return;
      }

      // Build a tolerant payload with multiple candidate keys
      const payload = {
        reference: referenceToVerify,
        payment_reference: referenceToVerify,
        trxref: referenceToVerify,
        tx_ref: referenceToVerify,
      };
      if (orderId) payload.order_id = orderId;

      setLoading(true);
      try {
        // Try the explicit verify endpoint first (this is what the backend viewset exposes).
        let resp = null;
        try {
          resp = await api.post("/main/payment/verify/", payload);
        } catch (err) {
          // If server returns 404 for verify endpoint, fall back to posting to /main/payment/
          const status = err?.response?.status;
          if (status === 404) {
            try {
              resp = await api.post("/main/payment/", payload);
            } catch (err2) {
              // fall through to outer catch
              throw err2;
            }
          } else {
            throw err;
          }
        }

        // Accept success when HTTP 200/201 + body indicates success.
        const okStatus =
          resp &&
          (resp.status === 200 || resp.status === 201) &&
          (resp.data && (resp.data.status === "success" || resp.data.status === true || resp.data.status === "ok"));

        if (okStatus) {
          // Verified successfully on the server
          setShowLocalSuccess(true);
          try {
            onSuccess && onSuccess({ reference: referenceToVerify, orderId, serverResponse: resp.data });
          } catch (e) {
            console.warn("onSuccess callback failed after verify:", e);
          }
        } else {
          // Show backend details if provided
          const details = (resp && resp.data && (resp.data.details || resp.data.message || JSON.stringify(resp.data))) || null;
          console.warn("Auto-verify response non-success:", resp?.status, resp?.data);
          Alert.alert("Verification failed", details || "Could not verify payment. Check Orders screen.");
        }
      } catch (e) {
        console.warn("Auto-verify exception:", e?.response?.data || e.message || e);
        const serverDetails = e?.response?.data?.details || e?.response?.data?.message || (e?.response?.data ? JSON.stringify(e.response.data) : null);
        Alert.alert("Verification error", serverDetails || "Network or server error while verifying payment.");
      } finally {
        setLoading(false);
      }
    },
    [onSuccess, orderId]
  );

  const safeHandleSuccess = useCallback(
    (reference) => {
      // If we don't have a reference, try using provided paymentReference; if still none, we still attempt verify with orderId only.
      const refToUse = reference || paymentReference || null;
      if (!refToUse) {
        // nothing to verify; call onClose so parent can poll orders
        successHandledRef.current = true;
        setShowLocalSuccess(true);
        try {
          onSuccess ? onSuccess({ reference: null, orderId }) : null;
        } catch (e) {
          console.warn("onSuccess fallback error:", e);
        }
        return;
      }

      if (successHandledRef.current) return;
      successHandledRef.current = true;

      // stop webview from continuing to load anything
      if (webviewRef.current && typeof webviewRef.current.stopLoading === "function") {
        try {
          webviewRef.current.stopLoading();
        } catch (e) {
          // ignore
        }
      }

      // show a brief local success screen (so user doesn't see backend JSON)
      setShowLocalSuccess(true);

      // try caller first; otherwise auto-verify
      (async () => {
        try {
          if (onSuccess) {
            await onSuccess({ reference: refToUse, orderId });
          } else {
            await safeAutoVerify(refToUse);
          }
        } catch (e) {
          console.warn("Error during success handling:", e);
        }
      })();
    },
    [onSuccess, orderId, paymentReference, safeAutoVerify]
  );

  const extractQueryParam = (url, name) => {
    if (!url) return null;
    try {
      const u = new URL(url);
      return u.searchParams.get(name);
    } catch (e) {
      const m = url.match(new RegExp(`[?&]${name}=([^&]+)`));
      return m ? decodeURIComponent(m[1]) : null;
    }
  };

  const findReferenceInUrl = (url) => {
    if (!url) return null;
    const candidates = ["reference", "trxref", "tx_ref", "payment_reference", "reference_no", "txref", "ref"];
    for (const name of candidates) {
      const v = extractQueryParam(url, name);
      if (v) return v;
    }
    return null;
  };

  const handleShouldStartLoadWithRequest = (request) => {
    try {
      const url = request && (request.url || request.mainDocumentURL) ? (request.url || request.mainDocumentURL) : null;
      if (!url) return true;

      if (callbackHost) {
        try {
          const u = new URL(url);
          if (u.hostname && u.hostname.indexOf(callbackHost) !== -1) {
            const ref = findReferenceInUrl(url);
            if (ref) {
              safeHandleSuccess(ref);
              return false;
            }
            if (paymentReference) {
              safeHandleSuccess(paymentReference);
              return false;
            }
            // no reference detected but callbackHost matched — still treat as success path (parent may poll by orderId)
            safeHandleSuccess(null);
            return false;
          }
        } catch (e) {
          // fallthrough
        }
      }

      const lower = url.toLowerCase();
      if (lower.includes("/main/payment/verify") || lower.includes("/api/payment/verify") || lower.includes("/verify/") || lower.includes("/verify?")) {
        const ref = findReferenceInUrl(url);
        if (ref) {
          safeHandleSuccess(ref);
        } else if (paymentReference) {
          safeHandleSuccess(paymentReference);
        } else {
          safeHandleSuccess(null);
        }
        return false;
      }

      const ref = findReferenceInUrl(url);
      if (ref) {
        safeHandleSuccess(ref);
        return false;
      }

      return true;
    } catch (e) {
      return true;
    }
  };

  const handleNavigationStateChange = (navState) => {
    try {
      const url = navState && (navState.url || navState.mainDocumentURL) ? (navState.url || navState.mainDocumentURL) : null;
      if (!url) return;

      if (callbackHost) {
        try {
          const u = new URL(url);
          if (u.hostname && u.hostname.indexOf(callbackHost) !== -1) {
            const ref = findReferenceInUrl(url);
            if (ref) {
              safeHandleSuccess(ref);
            } else if (paymentReference) {
              safeHandleSuccess(paymentReference);
            } else {
              safeHandleSuccess(null);
            }
            return;
          }
        } catch (e) {
          // fallthrough
        }
      }

      const ref = findReferenceInUrl(url);
      if (ref) {
        safeHandleSuccess(ref);
        return;
      }

      if (url.includes("/payment/success") || url.includes("status=success")) {
        if (paymentReference) {
          safeHandleSuccess(paymentReference);
        } else {
          safeHandleSuccess(null);
        }
      }
    } catch (e) {
      // ignore
    }
  };

  const handleWebViewMessage = (event) => {
    try {
      const raw = event.nativeEvent && event.nativeEvent.data ? event.nativeEvent.data : null;
      if (!raw) return;

      let data = null;
      try {
        data = JSON.parse(raw);
      } catch (e) {
        data = raw;
      }

      if (typeof data === "object" && data !== null) {
        const status = data.status || data.success || data.result || null;
        const ref =
          data.reference || data.tx_ref || data.trxref || data.reference_no || data.payment_reference || data.ref || null;
        if ((status === "success" || status === true) && ref) {
          safeHandleSuccess(ref);
          return;
        }
        if (data.status === "cancelled" || data.success === false) {
          onClose && onClose();
          return;
        }
      } else if (typeof data === "string") {
        const possible = findReferenceInUrl(data) || extractQueryParam(data, "reference");
        if (possible) {
          safeHandleSuccess(possible);
        }
      }
    } catch (e) {
      // ignore
    }
  };

  const handleLoadStart = () => setLoading(true);
  const handleLoadEnd = () => setLoading(false);

  const handleClose = () => {
    onClose && onClose();
  };

  if (showLocalSuccess) {
    return (
      <SafeAreaView style={styles.successContainer}>
        <View style={styles.successCard}>
          <Icon name="check-circle-outline" size={48} />
          <Text style={styles.successTitle}>Payment submitted</Text>
          <Text style={styles.successText}>We received the payment response. Verifying...</Text>

          <TouchableOpacity style={styles.successButton} onPress={handleClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={styles.successButtonText}>Please Wait...</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        ref={webviewRef}
        originWhitelist={["https://*", "http://*"]}
        source={{ uri: paymentUrl }}
        onMessage={handleWebViewMessage}
        onNavigationStateChange={handleNavigationStateChange}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        onLoadStart={handleLoadStart}
        onLoadEnd={handleLoadEnd}
        style={[styles.webview, { marginBottom: TOOLBAR_HEIGHT }]}
        onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
        renderLoading={() => (
          <View style={styles.center}>
            <ActivityIndicator size="large" />
          </View>
        )}
      />

      <View style={[styles.toolbar, Platform.select({ ios: styles.toolbarShadow, android: styles.toolbarShadow })]}>
        <TouchableOpacity onPress={handleClose} style={styles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Icon name="close" size={20} color="#111" />
          <Text style={styles.closeText}>Please wait...</Text>
        </TouchableOpacity>
      </View>

      {loading && (
        <View style={styles.loadingOverlay} pointerEvents="none">
          <ActivityIndicator size="large" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  webview: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 16 },
  errorText: { color: "red", fontSize: 16, textAlign: "center" },

  toolbar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 56,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e6e6e6",
    alignItems: "flex-end",
    justifyContent: "center",
    paddingRight: 14,
    paddingLeft: 14,
  },
  toolbarShadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  closeBtn: { flexDirection: "row", alignItems: "center" },
  closeText: { marginLeft: 8, color: "#111", fontSize: 15 },

  loadingOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 56, // don't cover toolbar
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },

  successContainer: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#fff" },
  successCard: {
    width: "90%",
    maxWidth: 420,
    padding: 24,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  successTitle: { marginTop: 12, fontSize: 20, fontWeight: "600" },
  successText: { marginTop: 8, fontSize: 14, textAlign: "center", color: "#333" },
  successButton: {
    marginTop: 18,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
    backgroundColor: "#f2f2f2",
  },
  successButtonText: { fontSize: 16, color: "#111" },
});
