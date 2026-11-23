# Broadcom dongle — experimental test-signed driver

This is an **opt-in experiment**, created only after explicit approval to enable Windows Test Mode.
The original WHQL-signed package in `BCM20702A0\` is untouched.

## Why

- The built-in MediaTek adapter pairs with other controllers but fails Secure Simple Pairing with the DualSense (`BTHUSB` Event 16, `SSP Paired = 0`), so Windows never installs the Bluetooth HID gamepad service.
- The Broadcom dongle (`USB\VID_19FF&PID_0239`) has a valid WHQL-signed driver, but Broadcom listed that hardware ID only in the INF's Windows 8.1 model section. Windows 11 therefore refuses to bind it (`CM_PROB_FAILED_INSTALL` / code 28).

## What was done

- `BCM20702A0-Test\` is a copy of the signed package with three changes:
  - the dongle's hardware ID added to `[Broadcom.NTamd64.10.0]`;
  - `CatalogFile` pointed at `bcbtums-test.cat`;
  - `DriverVer` bumped to `11/23/2026,12.0.1.1105` so it outranks the old package.
- A new catalog was generated with `makecat` over every INF-referenced file and signed with a locally generated test certificate (`pawd-test.cer`, subject `CN=Pawd Broadcom Test Signing`) using `signtool`.
- The certificate was imported into `LocalMachine\Root` and `LocalMachine\TrustedPublisher`.
- `bcdedit /set testsigning on` was run. Secure Boot is off and HVCI is not enabled, so this should take effect after a reboot.

## Finish the setup

1. Reboot into Test Mode.
2. Run `apply_broadcom_test.ps1` from an elevated PowerShell. It removes the old failing `oem145.inf`, installs the test package, rescans, and reports the dongle status.
3. If the radio comes up healthy, remove any stale DualSense pairing, put the controller into pairing mode (PS + Create until the light bar flashes rapidly), and pair it in Windows Settings.
4. Check Pawd's **Live controller** tab for a PlayStation-family gamepad.

## Rollback

1. `bcdedit /set testsigning off` in an elevated PowerShell, then reboot.
2. Remove the test driver package: `pnputil /enum-drivers` to find the `bcbtums.inf` OEM number, then `pnputil /delete-driver oemXX.inf /uninstall /force`.
3. Remove `CN=Pawd Broadcom Test Signing` from `LocalMachine\Root` and `LocalMachine\TrustedPublisher`.
4. Delete `BCM20702A0-Test\`, `pawd-test.cer`, and these scripts/logs if no longer needed.

Test Mode weakens driver signature enforcement. Don't leave it enabled longer than needed.
