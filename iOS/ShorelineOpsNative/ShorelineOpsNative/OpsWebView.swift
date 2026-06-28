import Combine
import SwiftUI
import UIKit
import WebKit

@MainActor
final class OpsWebViewStore: ObservableObject {
    let startURL = URL(string: "https://slaquatics.com/ops-login.html")!
    let allowedHosts: Set<String> = [
        "slaquatics.com",
        "www.slaquatics.com"
    ]
    weak var webView: WKWebView?

    @Published var isLoading = true
    @Published var hasLoadedOnce = false
    @Published var statusText = "Connecting to private ops…"
    @Published var blockedMessage: String?
    @Published var pageTitle = "Shoreline Ops"
    @Published var pageSubtitle = "Private operations"
    @Published var canGoBack = false

    func attach(_ webView: WKWebView) {
        self.webView = webView
        updateNavigationState(from: webView)
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

    func goBack() {
        guard let webView, webView.canGoBack else { return }
        blockedMessage = nil
        statusText = "Returning to the last screen…"
        webView.goBack()
    }

    func handleNavigationStart(url: URL?) {
        isLoading = true
        blockedMessage = nil
        updatePageMetadata(for: url)
        if let host = url?.host, !host.isEmpty {
            statusText = "Loading \(host)…"
        } else {
            statusText = "Loading Shoreline ops…"
        }
    }

    func handleNavigationSuccess(webView: WKWebView) {
        isLoading = false
        hasLoadedOnce = true
        blockedMessage = nil
        updateNavigationState(from: webView)
        let url = webView.url
        if let host = url?.host, allowedHosts.contains(host.lowercased()) {
            statusText = "Connected to private ops"
        } else {
            statusText = "Private ops ready"
        }
    }

    func handleNavigationFailure(_ error: Error) {
        isLoading = false
        blockedMessage = userFacingMessage(for: error)
        statusText = "Connection problem"
    }

    func blockExternalNavigation(for url: URL) {
        isLoading = false
        blockedMessage = "That link opens outside Shoreline Ops, so it stays blocked in the iPhone app."
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

        if scheme == "https" {
            return allowedHosts.contains((url.host ?? "").lowercased())
        }

        return false
    }

    private func updateNavigationState(from webView: WKWebView?) {
        canGoBack = webView?.canGoBack ?? false
        updatePageMetadata(for: webView?.url, title: webView?.title)
    }

    private func updatePageMetadata(for url: URL?, title: String? = nil) {
        let cleanTitle = String(title ?? "")
            .trimmingCharacters(in: .whitespacesAndNewlines)
        if !cleanTitle.isEmpty {
            pageTitle = cleanTitle
        } else if let host = url?.host, !host.isEmpty {
            pageTitle = allowedHosts.contains(host.lowercased()) ? "Shoreline Ops" : host
        } else {
            pageTitle = "Shoreline Ops"
        }

        if let host = url?.host, !host.isEmpty {
            if allowedHosts.contains(host.lowercased()) {
                pageSubtitle = "Shoreline secure view"
            } else {
                pageSubtitle = host
            }
        } else {
            pageSubtitle = "Private operations"
        }
    }

    private func userFacingMessage(for error: Error) -> String {
        let nsError = error as NSError
        if nsError.domain == NSURLErrorDomain {
            switch nsError.code {
            case NSURLErrorNotConnectedToInternet:
                return "No internet connection. Reconnect and try again."
            case NSURLErrorTimedOut:
                return "Shoreline Ops took too long to respond. Try reloading."
            case NSURLErrorCannotFindHost, NSURLErrorCannotConnectToHost:
                return "Couldn’t reach the Shoreline server right now."
            case NSURLErrorCancelled:
                return blockedMessage ?? "Loading was interrupted."
            default:
                break
            }
        }
        return nsError.localizedDescription
    }
}

struct OpsWebView: UIViewRepresentable {
    let store: OpsWebViewStore

    private static let nativeBootstrapScript = """
    window.__SHORELINE_NATIVE_APP__ = true;
    document.documentElement.dataset.nativeApp = 'true';
    document.addEventListener('DOMContentLoaded', function () {
      if (document.body) {
        document.body.dataset.nativeApp = 'true';
      }
      try {
        localStorage.setItem('shoreline_ops_install_banner_dismissed_v1', String(Date.now()));
      } catch (error) {}
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(function (registrations) {
          registrations.forEach(function (registration) { registration.unregister(); });
        }).catch(function () {});
      }
    });
    """

    func makeCoordinator() -> Coordinator {
        Coordinator(store: store)
    }

    func makeUIView(context: Context) -> WKWebView {
        let configuration = WKWebViewConfiguration()
        configuration.defaultWebpagePreferences.allowsContentJavaScript = true
        configuration.preferences.javaScriptCanOpenWindowsAutomatically = false
        configuration.applicationNameForUserAgent = "ShorelineOpsNative/1.0"
        configuration.websiteDataStore = .default()
        configuration.userContentController.addUserScript(
            WKUserScript(
                source: Self.nativeBootstrapScript,
                injectionTime: .atDocumentStart,
                forMainFrameOnly: false
            )
        )

        let webView = WKWebView(frame: .zero, configuration: configuration)
        webView.navigationDelegate = context.coordinator
        webView.allowsBackForwardNavigationGestures = true
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        webView.scrollView.keyboardDismissMode = .interactive
        webView.scrollView.showsVerticalScrollIndicator = false
        webView.scrollView.bounces = false
        webView.customUserAgent = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1 ShorelineOpsNative/1.0"
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
                store.handleNavigationSuccess(webView: webView)
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
