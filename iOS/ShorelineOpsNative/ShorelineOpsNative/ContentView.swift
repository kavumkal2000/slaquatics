import SwiftUI

struct ContentView: View {
    @StateObject private var store = OpsWebViewStore()

    var body: some View {
        ZStack {
            background

            VStack(spacing: 12) {
                topBar

                ZStack {
                    webContainer

                    if !store.hasLoadedOnce {
                        launchOverlay
                    }
                }
            }
            .padding(.horizontal, 14)
            .padding(.top, 8)
        }
        .safeAreaInset(edge: .bottom) {
            bottomBar
                .padding(.horizontal, 14)
                .padding(.top, 8)
                .padding(.bottom, 8)
        }
        .preferredColorScheme(.dark)
    }

    private var background: some View {
        ZStack {
            LinearGradient(
                colors: [
                    Color(red: 5 / 255, green: 12 / 255, blue: 23 / 255),
                    Color(red: 9 / 255, green: 22 / 255, blue: 37 / 255),
                    Color(red: 13 / 255, green: 31 / 255, blue: 49 / 255)
                ],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()

            Circle()
                .fill(Color(red: 0 / 255, green: 183 / 255, blue: 255 / 255).opacity(0.18))
                .frame(width: 240, height: 240)
                .blur(radius: 20)
                .offset(x: 120, y: -260)

            Circle()
                .fill(Color(red: 245 / 255, green: 166 / 255, blue: 35 / 255).opacity(0.16))
                .frame(width: 220, height: 220)
                .blur(radius: 18)
                .offset(x: -140, y: 280)
        }
    }

    private var topBar: some View {
        HStack(spacing: 14) {
            ZStack {
                RoundedRectangle(cornerRadius: 18, style: .continuous)
                    .fill(
                        LinearGradient(
                            colors: [
                                Color(red: 0 / 255, green: 183 / 255, blue: 255 / 255).opacity(0.92),
                                Color(red: 18 / 255, green: 112 / 255, blue: 255 / 255).opacity(0.9)
                            ],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                Image("ShorelineBrandMark")
                    .resizable()
                    .scaledToFit()
                    .padding(6)
            }
            .frame(width: 54, height: 54)
            .shadow(color: .black.opacity(0.22), radius: 12, y: 8)

            VStack(alignment: .leading, spacing: 4) {
                Image("ShorelineBrandWordmark")
                    .resizable()
                    .scaledToFit()
                    .frame(width: 172, height: 54, alignment: .leading)

                Text(store.pageSubtitle)
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundStyle(.white.opacity(0.7))
                    .lineLimit(1)
            }

            Spacer()

            VStack(alignment: .trailing, spacing: 6) {
                statusPill

                Text(store.pageTitle)
                    .font(.system(size: 12, weight: .bold))
                    .foregroundStyle(.white.opacity(0.9))
                    .lineLimit(1)
            }
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 12)
        .background(
            RoundedRectangle(cornerRadius: 24, style: .continuous)
                .fill(Color.white.opacity(0.07))
                .overlay(
                    RoundedRectangle(cornerRadius: 24, style: .continuous)
                        .stroke(Color.white.opacity(0.08), lineWidth: 1)
                )
        )
    }

    private var statusPill: some View {
        HStack(spacing: 8) {
            Circle()
                .fill(store.isLoading ? Color.orange : Color.green)
                .frame(width: 8, height: 8)

            Text(store.statusText)
                .font(.system(size: 11, weight: .bold))
                .foregroundStyle(.white.opacity(0.95))
                .lineLimit(1)
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 7)
        .background(Color.white.opacity(0.08))
        .clipShape(Capsule())
    }

    private var webContainer: some View {
        OpsWebView(store: store)
            .clipShape(RoundedRectangle(cornerRadius: 28, style: .continuous))
            .overlay {
                RoundedRectangle(cornerRadius: 28, style: .continuous)
                    .stroke(Color.white.opacity(0.08), lineWidth: 1)
            }
            .overlay(alignment: .top) {
                if store.isLoading, store.hasLoadedOnce {
                    loadingBar
                        .padding(.top, 14)
                }
            }
            .overlay(alignment: .bottom) {
                if let blockedMessage = store.blockedMessage, !blockedMessage.isEmpty {
                    Text(blockedMessage)
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundStyle(.white)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 16)
                        .padding(.vertical, 12)
                        .background(Color.red.opacity(0.92))
                        .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
                        .padding(.horizontal, 18)
                        .padding(.bottom, 18)
                }
            }
            .background(
                RoundedRectangle(cornerRadius: 28, style: .continuous)
                    .fill(Color.black.opacity(0.16))
            )
            .shadow(color: .black.opacity(0.28), radius: 30, y: 18)
    }

    private var loadingBar: some View {
        HStack(spacing: 10) {
            ProgressView()
                .progressViewStyle(.circular)
                .tint(.white)
                .scaleEffect(0.82)

            Text("Loading live Shoreline ops…")
                .font(.system(size: 12, weight: .bold))
                .foregroundStyle(.white)
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 10)
        .background(Color.black.opacity(0.4))
        .clipShape(Capsule())
    }

    private var launchOverlay: some View {
        VStack(spacing: 16) {
            ZStack {
                RoundedRectangle(cornerRadius: 28, style: .continuous)
                    .fill(
                        LinearGradient(
                            colors: [
                                Color(red: 0 / 255, green: 183 / 255, blue: 255 / 255).opacity(0.92),
                                Color(red: 18 / 255, green: 112 / 255, blue: 255 / 255).opacity(0.9)
                            ],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                Image("ShorelineBrandMark")
                    .resizable()
                    .scaledToFit()
                    .padding(12)
            }
            .frame(width: 104, height: 104)

            Image("ShorelineBrandWordmark")
                .resizable()
                .scaledToFit()
                .frame(width: 260)

            VStack(spacing: 6) {
                Text("Opening Shoreline Ops")
                    .font(.system(size: 24, weight: .black, design: .rounded))
                    .foregroundStyle(.white)

                Text("Bookings, invoices, customers, and tracker tools are loading into the native app shell.")
                    .font(.system(size: 14, weight: .medium))
                    .foregroundStyle(.white.opacity(0.72))
                    .multilineTextAlignment(.center)
                    .lineSpacing(3)
            }

            ProgressView()
                .progressViewStyle(.circular)
                .tint(.white)
                .scaleEffect(1.1)
        }
        .padding(.horizontal, 28)
        .padding(.vertical, 34)
        .background(
            RoundedRectangle(cornerRadius: 30, style: .continuous)
                .fill(Color(red: 10 / 255, green: 24 / 255, blue: 41 / 255).opacity(0.92))
                .overlay(
                    RoundedRectangle(cornerRadius: 30, style: .continuous)
                        .stroke(Color.white.opacity(0.08), lineWidth: 1)
                )
        )
        .shadow(color: .black.opacity(0.3), radius: 30, y: 16)
        .padding(.horizontal, 18)
    }

    private var bottomBar: some View {
        HStack(spacing: 10) {
            actionButton(title: "Back", systemImage: "chevron.left", isDisabled: !store.canGoBack) {
                store.goBack()
            }

            actionButton(title: "Home", systemImage: "house.fill") {
                store.loadHome()
            }

            actionButton(title: "Refresh", systemImage: "arrow.clockwise") {
                store.reload()
            }
        }
        .padding(10)
        .background(
            RoundedRectangle(cornerRadius: 24, style: .continuous)
                .fill(Color(red: 9 / 255, green: 20 / 255, blue: 34 / 255).opacity(0.94))
                .overlay(
                    RoundedRectangle(cornerRadius: 24, style: .continuous)
                        .stroke(Color.white.opacity(0.08), lineWidth: 1)
                )
        )
        .shadow(color: .black.opacity(0.25), radius: 18, y: 10)
    }

    private func actionButton(
        title: String,
        systemImage: String,
        isDisabled: Bool = false,
        action: @escaping () -> Void
    ) -> some View {
        Button(action: action) {
            VStack(spacing: 6) {
                Image(systemName: systemImage)
                    .font(.system(size: 14, weight: .bold))
                Text(title)
                    .font(.system(size: 11, weight: .bold))
            }
            .foregroundStyle(isDisabled ? .white.opacity(0.35) : .white)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 10)
            .background(isDisabled ? Color.white.opacity(0.03) : Color.white.opacity(0.06))
            .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
        }
        .buttonStyle(.plain)
        .disabled(isDisabled)
    }
}

#Preview {
    ContentView()
}
