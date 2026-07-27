package com.wifi_track_attendance

import android.content.Context
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.net.wifi.WifiInfo
import android.net.wifi.WifiManager
import android.os.Build
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableMap

/**
 * WifiModule — Kotlin Native Module for React Native
 *
 * WHY THIS EXISTS:
 * react-native-wifi-reborn is an Old Architecture module (no TurboModule spec).
 * This project uses New Architecture (newArchEnabled=true), so we write our own
 * bridge using ReactContextBaseJavaModule which works with both architectures.
 *
 * DATA SOURCES:
 * - WifiManager: provides SSID, BSSID, RSSI, frequency, link speed, network ID
 * - ConnectivityManager: provides IP address, connection type, network state
 * - Build: provides Android version for capability checks
 *
 * ANDROID API NOTES:
 * - SSID returns "<unknown ssid>" without ACCESS_FINE_LOCATION (pre-Android 12)
 *   or NEARBY_WIFI_DEVICES (Android 12+)
 * - WifiInfo.getIpAddress() returns an integer in little-endian order
 * - RSSI is negative dBm (-30 = excellent, -90 = very poor)
 * - Frequency is in MHz (2400 = 2.4 GHz band, 5000 = 5 GHz band)
 */
class WifiModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "WifiModule"

    /**
     * Returns all available WiFi information as a JS object.
     * Called from JS via: NativeModules.WifiModule.getWifiInfo()
     */
    @ReactMethod
    fun getWifiInfo(promise: Promise) {
        try {
            val data: WritableMap = Arguments.createMap()
            val wifiManager = reactContext.applicationContext
                .getSystemService(Context.WIFI_SERVICE) as? WifiManager

            if (wifiManager == null) {
                data.putBoolean("isConnected", false)
                data.putString("error", "WifiManager not available")
                promise.resolve(data)
                return
            }

            // Check if WiFi is enabled at all
            val isWifiEnabled = wifiManager.isWifiEnabled
            data.putBoolean("isWifiEnabled", isWifiEnabled)

            // Get connection info — works on all supported API levels (24+)
            @Suppress("DEPRECATION")
            val wifiInfo: WifiInfo? = wifiManager.connectionInfo

            if (wifiInfo == null || wifiInfo.networkId == -1) {
                // networkId == -1 means not associated with any network
                data.putBoolean("isConnected", false)
                data.putString("ssid", "Not Connected")
                data.putString("bssid", "N/A")
                data.putString("ipAddress", "N/A")
                data.putInt("rssi", 0)
                data.putInt("frequency", 0)
                data.putInt("linkSpeed", 0)
                data.putString("networkId", "N/A")
                data.putString("band", "N/A")
                data.putInt("signalLevel", 0)
                promise.resolve(data)
                return
            }

            data.putBoolean("isConnected", true)

            // --- SSID ---
            // On Android 8.1+: requires ACCESS_FINE_LOCATION for SSID
            // On Android 12+: requires NEARBY_WIFI_DEVICES or ACCESS_FINE_LOCATION
            // The SSID string from the OS is wrapped in quotes — we strip them
            val rawSsid = wifiInfo.ssid ?: "<unknown ssid>"
            val ssid = rawSsid.removePrefix("\"").removeSuffix("\"")
            data.putString("ssid", ssid)

            // --- BSSID (MAC address of the access point) ---
            val bssid = wifiInfo.bssid ?: "N/A"
            data.putString("bssid", bssid)

            // --- IP Address ---
            // getIpAddress() returns an int in little-endian byte order
            val ipInt = wifiInfo.ipAddress
            val ipAddress = if (ipInt != 0) {
                "%d.%d.%d.%d".format(
                    ipInt and 0xFF,
                    (ipInt shr 8) and 0xFF,
                    (ipInt shr 16) and 0xFF,
                    (ipInt shr 24) and 0xFF
                )
            } else {
                "0.0.0.0"
            }
            data.putString("ipAddress", ipAddress)

            // --- Signal Strength (RSSI) ---
            // RSSI: Received Signal Strength Indicator in dBm
            // Typical range: -30 (excellent) to -90 (very poor)
            val rssi = wifiInfo.rssi
            data.putInt("rssi", rssi)

            // Convert RSSI to a 0-5 scale using Android's built-in calculator
            // WifiManager.calculateSignalLevel() normalises the RSSI to numLevels
            val signalLevel = WifiManager.calculateSignalLevel(rssi, 5)
            data.putInt("signalLevel", signalLevel)

            // --- Frequency ---
            // In MHz: ~2400 for 2.4 GHz band, ~5000 for 5 GHz band, ~6000 for 6 GHz
            val frequency = wifiInfo.frequency
            data.putInt("frequency", frequency)

            // Determine band name from frequency
            val band = when {
                frequency in 2400..2500 -> "2.4 GHz"
                frequency in 4900..5900 -> "5 GHz"
                frequency >= 5925 -> "6 GHz"
                else -> "Unknown"
            }
            data.putString("band", band)

            // --- Link Speed ---
            // In Mbps — the current link speed of the connection
            val linkSpeed = wifiInfo.linkSpeed
            data.putInt("linkSpeed", linkSpeed)

            // --- Network ID ---
            val networkId = wifiInfo.networkId
            data.putString("networkId", networkId.toString())

            // --- Hidden SSID ---
            data.putBoolean("hiddenSsid", wifiInfo.hiddenSSID)

            // --- Additional info via ConnectivityManager ---
            enrichWithConnectivityInfo(data)

            promise.resolve(data)
        } catch (e: Exception) {
            promise.reject("WIFI_ERROR", "Failed to get WiFi info: ${e.message}", e)
        }
    }

    /**
     * Adds network type and validated connection status using ConnectivityManager.
     * ConnectivityManager is more reliable for checking actual internet connectivity
     * vs. just being associated to a WiFi network.
     */
    private fun enrichWithConnectivityInfo(data: WritableMap) {
        try {
            val cm = reactContext.getSystemService(Context.CONNECTIVITY_SERVICE)
                as? ConnectivityManager ?: return

            val network = cm.activeNetwork
            if (network == null) {
                data.putString("networkType", "None")
                data.putBoolean("hasInternet", false)
                return
            }

            val capabilities = cm.getNetworkCapabilities(network)
            if (capabilities == null) {
                data.putString("networkType", "Unknown")
                data.putBoolean("hasInternet", false)
                return
            }

            val isWifi = capabilities.hasTransport(NetworkCapabilities.TRANSPORT_WIFI)
            val isCellular = capabilities.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR)
            val hasInternet = capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)

            data.putString("networkType", when {
                isWifi -> "WiFi"
                isCellular -> "Cellular"
                else -> "Other"
            })
            data.putBoolean("hasInternet", hasInternet)
        } catch (_: Exception) {
            // Non-critical enrichment — swallow the error
            data.putString("networkType", "Unknown")
            data.putBoolean("hasInternet", false)
        }
    }

    /**
     * Checks whether WiFi is currently enabled on the device.
     */
    @ReactMethod
    fun isWifiEnabled(promise: Promise) {
        try {
            val wifiManager = reactContext.applicationContext
                .getSystemService(Context.WIFI_SERVICE) as? WifiManager
            promise.resolve(wifiManager?.isWifiEnabled ?: false)
        } catch (e: Exception) {
            promise.reject("WIFI_ERROR", e.message, e)
        }
    }
}
