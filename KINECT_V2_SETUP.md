# Kinect v2 (Xbox One Kinect) - PC Installation Guide

This document provides a clean, reliable setup process for using the Kinect v2 sensor on a Windows PC, along with common pitfalls and troubleshooting steps.

---

## Requirements

### Hardware

- Kinect v2 sensor (Xbox One Kinect)
- Kinect Adapter for Windows (required):
  - Power supply
  - USB 3.0 breakout box
- PC with:
  - USB 3.0 controller (not just a USB 3.0 port)
  - 64-bit Windows (Windows 8.1 or Windows 10 recommended)
  - Dedicated CPU and GPU (integrated graphics may be insufficient)

---

### Software

- Kinect for Windows SDK 2.0
- Kinect Runtime (included with SDK)
- Microsoft Visual C++ Redistributables (installed automatically with SDK)

Official resources:
- Kinect for Windows SDK 2.0 download: https://www.microsoft.com/en-us/download/details.aspx?id=44561
- Kinect for Windows SDK documentation (archive): https://learn.microsoft.com/en-us/previous-versions/windows/kinect/
- Kinect adapter support article: https://support.xbox.com/en-US/help/hardware-network/kinect/set-up-and-use-kinect-sensor-with-adapter

---

## Installation

### 1. Install Software First

1. Install Kinect SDK 2.0.
2. Reboot the system.

Do not connect the Kinect sensor before completing this step.

---

### 2. Connect Hardware

Connect components in the following order:

1. Kinect sensor -> Adapter box
2. Adapter -> Power outlet
3. Adapter -> USB 3.0 port on PC

Wait approximately 10 seconds after connecting.

---

### 3. Verify Installation

Run:

Kinect Configuration Verifier

Expected results:
- USB controller supported
- Bandwidth sufficient
- GPU compatible

All checks should pass.

---

### 4. Test with Sample Applications

Launch one of the SDK samples:
- Kinect Studio
- Body Basics

If color, depth, and body tracking streams are visible, installation is complete.

---

## Common Pitfalls

### 1. Unsupported USB Controller

Symptoms:
- Kinect not detected
- Intermittent disconnects
- Bandwidth errors

Cause:
Not all USB 3.0 chipsets are compatible.

Known good:
- Intel USB 3.0 controllers
- Renesas (generally works)

Problematic:
- ASMedia
- VIA

Fix:
- Use a motherboard USB port (Intel preferred)
- Install a compatible PCIe USB 3.0 expansion card if needed

---

### 2. Missing External Power

Symptoms:
- Device not detected
- No LED activity

Cause:
Kinect v2 requires external power.

Fix:
- Use the official Kinect adapter
- Verify power supply is connected

---

### 3. USB Hub Usage

Symptoms:
- Unstable tracking
- Initialization failures

Fix:
- Connect directly to motherboard USB port
- Do not use hubs or front panel ports

---

### 4. Driver Issues

Symptoms:
- Unknown USB device
- Kinect service fails to start

Fix:
- Reinstall Kinect SDK
- Check Device Manager for:
  - Kinect Sensor
  - Kinect Camera
  - Kinect Audio

---

### 5. USB Bandwidth Contention

Symptoms:
- Frame drops
- Random disconnects

Fix:
- Disconnect other USB 3.0 devices
- Use a dedicated USB controller

---

### 6. Unsupported GPU

Symptoms:
- Applications crash
- No body tracking

Fix:
- Ensure DirectX 11-compatible GPU
- Update graphics drivers

---

### 7. USB Power Management

Symptoms:
- Device disconnects after idle

Fix:
Disable power saving:

Device Manager -> USB Root Hub -> Power Management -> Uncheck "Allow the computer to turn off this device"

---

### 8. Windows 11 Compatibility

Note:
Kinect v2 is not officially supported on Windows 11.

Symptoms:
- Partial functionality
- Unstable operation

Recommendation:
- Use Windows 10 for best results

---

## Troubleshooting Checklist

If the device is not working, verify the following:

1. Kinect power LED is on.
2. Device appears in Device Manager.
3. Kinect Configuration Verifier passes all checks.
4. USB controller is compatible (Intel preferred).
5. Direct connection (no hub).
6. GPU supports DirectX 11.

---

## Best Practices

- Use a rear motherboard USB port
- Avoid USB extension cables
- Keep Kinect on a dedicated USB controller if possible
- Disconnect other USB 3.0 devices during setup
- Start debugging with only Kinect connected

---

## Notes

- The Kinect v2 sensor has strict bandwidth and power requirements.
- Most issues are caused by USB controller incompatibility or insufficient power.
- Always validate hardware compatibility before debugging software.
