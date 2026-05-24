import Combine
import SwiftUI
import UIKit
import WebKit

@MainActor
final class OpsWebViewStore: ObservableObject {
    let startURL = URL(string: "https://shoreline-aquatics-ops.onrender.com/ops-login.html")!
    let allowedHosts: Set<String> = [
        "shoreline-aquatics-ops.onrender.com",
        "slaquatics.com",
        "www.slaquatics.com"
    ]
    weak var webView: WKWebView?

    @Published var isLoading = true
    @Published var statusText = "Connecting to private ops…"
    @Published var blockedMessage: String?

    func attach(_ webView: WKWebView) {
        self.webView = webView
    }

    func loadHome() {
        blockedMessage = nil
        statusText = "Opening Shoreline ops…"
        webView?.load(URLRequest(url: startURL, cachePolicy: .reloadIgnoringLocalCacheData))
    }

    func reload() {
        blockedMessage = nil
        statusText = "Refreshing private ops…"
        if let webView {
            if webView.url == nil {
                loadHome()
            } else {
                webView.reload()
            }
        }
    }

    func handleNavigationStart(url: URL?) {
        isLoading = true
        blockedMessage = nil
        if let host = url?.host, !host.isEmpty {
            statusText = "Loading \(host)…"
        } else {
            statusText = "Loading Shoreline ops…"
        }
    }

    func handleNavigationSuccess(url: URL?) {
        isLoading = false
        blockedMessage = nil
        if let host = url?.host, allowedHosts.contains(host.lowercased()) {
            statusText = "Connected to private ops"
        } else {
            statusText = "Private ops ready"
        }
    }

    func handleNavigationFailure(_ error: Error) {
        isLoading = false
        blockedMessage = error.localizedDescription
        statusText = "Connection problem"
    }

    func blockExternalNavigation(for url: URL) {
        isLoading = false
        blockedMessage = "External link blocked in the native app: \(url.host ?? url.absoluteString)"
        statusText = "External link blocked"
    }

    func allowNavigation(to url: URL?) -> Bool {
        guard let url else { return true }
        guard let scheme = url.scheme?.lowercased() else { return false }

        if ["about", "data", "blob"].contains(scheme) {
            return true
        }

        if ["tel", "mailto", "sms", "facetime", "maps"].contains(scheme) {
            UIApplication.shared.open(url)
            return false
        }

        if scheme == "https" || scheme == "http" {
            return allowedHosts.contains((url.host ?? "").lowercased())
        }

        return false
    }
}

struct OpsWebView: UIViewRepresentable {
    let store: OpsWebViewStore

    func makeCoordinator() -> Coordinator {
        Coordinator(store: store)
    }

    func makeUIView(context: Context) -> WKWebView {
        let configuration = WKWebViewConfiguration()
        configuration.defaultWebpagePreferences.allowsContentJavaScript = true
        configuration.preferences.javaScriptCanOpenWindowsAutomatically = false
        configuration.applicationNameForUserAgent = "ShorelineOpsNative/1.0"
        configuration.websiteDataStore = .default()

        let webView = WKWebView(frame: .zero, configuration: configuration)
        webView.navigationDelegate = context.coordinator
        webView.allowsBackForwardNavigationGestures = false
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        webView.scrollView.keyboardDismissMode = .interactive
        webView.isOpaque = false
        webView.backgroundColor = UIColor.clear
        webView.scrollView.backgroundColor = UIColor.clear

        store.attach(webView)
        store.loadHome()
        return webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) {
        store.attach(webView)
    }

    final class Coordinator: NSObject, WKNavigationDelegate {
        let store: OpsWebViewStore

        init(store: OpsWebViewStore) {
            self.store = store
        }

        func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) {
            Task { @MainActor in
                store.handleNavigationStart(url: webView.url)
            }
        }

        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            Task { @MainActor in
                store.handleNavigationSuccess(url: webView.url)
            }
        }

        func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
            Task { @MainActor in
                store.handleNavigationFailure(error)
            }
        }

        func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
            Task { @MainActor in
                store.handleNavigationFailure(error)
            }
        }

        func webView(
            _ webView: WKWebView,
            decidePolicyFor navigationAction: WKNavigationAction,
            decisionHandler: @escaping (WKNavigationActionPolicy) -> Void
        ) {
            if store.allowNavigation(to: navigationAction.request.url) {
                decisionHandler(.allow)
            } else {
                if let url = navigationAction.request.url {
                    Task { @MainActor in
                        store.blockExternalNavigation(for: url)
                    }
                }
                decisionHandler(.cancel)
            }
        }
    }
}
