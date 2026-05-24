import SwiftUI

struct ContentView: View {
    @StateObject private var store = OpsWebViewStore()

    var body: some View {
        ZStack {
            LinearGradient(
                colors: [
                    Color(red: 8 / 255, green: 18 / 255, blue: 31 / 255),
                    Color(red: 15 / 255, green: 31 / 255, blue: 49 / 255)
                ],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()

            VStack(spacing: 18) {
                header

                OpsWebView(store: store)
                    .clipShape(RoundedRectangle(cornerRadius: 28, style: .continuous))
                    .overlay(alignment: .topTrailing) {
                        if store.isLoading {
                            ProgressView()
                                .progressViewStyle(.circular)
                                .tint(.white)
                                .padding(16)
                        }
                    }
                    .overlay(alignment: .bottom) {
                        if let blockedMessage = store.blockedMessage, !blockedMessage.isEmpty {
                            Text(blockedMessage)
                                .font(.system(size: 13, weight: .semibold))
                                .foregroundStyle(.white)
                                .padding(.horizontal, 14)
                                .padding(.vertical, 10)
                                .background(Color.red.opacity(0.92))
                                .clipShape(Capsule())
                                .padding(.bottom, 16)
                        }
                    }
                    .shadow(color: .black.opacity(0.28), radius: 24, y: 14)
            }
            .padding(.horizontal, 16)
            .padding(.top, 12)
            .padding(.bottom, 10)
        }
        .preferredColorScheme(.dark)
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 6) {
                    Text("Shoreline Ops")
                        .font(.system(size: 28, weight: .black, design: .rounded))
                        .foregroundStyle(.white)

                    Text("Private iPhone app for bookings and operations.")
                        .font(.system(size: 14, weight: .medium))
                        .foregroundStyle(.white.opacity(0.72))
                }

                Spacer()

                HStack(spacing: 10) {
                    headerButton(title: "Home", systemImage: "house.fill") {
                        store.loadHome()
                    }

                    headerButton(title: "Reload", systemImage: "arrow.clockwise") {
                        store.reload()
                    }
                }
            }

            HStack(spacing: 10) {
                Capsule()
                    .fill(store.isLoading ? Color.orange : Color.green)
                    .frame(width: 9, height: 9)

                Text(store.statusText)
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(.white.opacity(0.9))
                    .lineLimit(1)

                Spacer()

                Text("Native Wrapper")
                    .font(.system(size: 12, weight: .bold))
                    .foregroundStyle(Color(red: 1.0, green: 185 / 255, blue: 69 / 255))
                    .padding(.horizontal, 12)
                    .padding(.vertical, 7)
                    .background(Color.white.opacity(0.06))
                    .clipShape(Capsule())
            }
        }
        .padding(18)
        .background(
            RoundedRectangle(cornerRadius: 26, style: .continuous)
                .fill(Color.white.opacity(0.06))
                .overlay(
                    RoundedRectangle(cornerRadius: 26, style: .continuous)
                        .stroke(Color.white.opacity(0.08), lineWidth: 1)
                )
        )
    }

    private func headerButton(title: String, systemImage: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Label(title, systemImage: systemImage)
                .font(.system(size: 13, weight: .bold))
                .foregroundStyle(.white)
                .padding(.horizontal, 14)
                .padding(.vertical, 10)
                .background(Color.white.opacity(0.08))
                .clipShape(Capsule())
        }
        .buttonStyle(.plain)
    }
}

#Preview {
    ContentView()
}
