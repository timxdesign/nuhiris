# Biometric Device Setup Guide

## Supported Devices

### Fingerprint Scanners
- Digital Persona U.are.U 4500 (recommended for facilities)
- SecuGen Hamster Pro 20
- Any FBI PIV / FAP 10 certified scanner

### Cameras (Face Verification)
- Logitech C920 HD Pro (desktop registration)
- Any USB camera with min 720p and auto-focus
- Mobile device front camera (for app-based verification)

## Setup Steps

### 1. Hardware Installation
1. Connect the biometric device to the registration workstation via USB
2. Verify the device appears in the operating system's device manager
3. Install manufacturer drivers if not auto-detected

### 2. Device Registration in NUHIRIS
1. Log in as **Facility Admin**
2. Navigate to **Admin > Devices** (or contact your state IT coordinator)
3. Click **Register Device**
4. Enter:
   - Device serial number (on device label)
   - Device type (fingerprint_scanner or camera)
   - Assigned facility
5. Submit — the system generates a device attestation key
6. Save the attestation key securely — it's shown only once

### 3. Mobile App Device Attestation
1. Install the NUHIRIS app from the approved distribution channel
2. Log in with provider credentials
3. Navigate to **Settings > Device Attestation**
4. The app automatically registers the device with hardware attestation
5. Verify status shows "Device Attested: Yes"

### 4. Testing
1. Perform a test biometric capture using a staff member
2. Verify the capture appears in **Admin > Biometric Events**
3. Confirm all checks pass:
   - Liveness: Pass
   - Device Attested: Yes
   - Geofence: Pass (device must be within facility GPS boundary)

## Geofence Configuration
Each facility has a GPS boundary. Biometric captures outside this boundary are flagged.

To set up geofence:
1. Contact your state IT coordinator with facility GPS coordinates
2. Provide the facility boundary radius (default: 200 meters)
3. The coordinator configures this in the facility settings

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Device not detected | Check USB connection, try different port, install drivers |
| Liveness check fails | Ensure adequate lighting, remove glasses/mask, hold still |
| Geofence fails | Verify GPS is enabled, check facility coordinates are correct |
| "Device not attested" | Re-register device in Admin panel, check attestation key |
| Low confidence score | Clean sensor surface, ensure dry fingers, retry capture |
| NIMC API timeout | Check internet connectivity, retry — the system queues for retry |

## Security Notes
- Never share device attestation keys
- Report lost or stolen devices immediately — they will be deactivated
- Biometric raw data is never stored locally — it's sent to NIMC for matching
- All biometric events are logged and auditable
