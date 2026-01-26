# Compliance & Security Implementation Guide

We have successfully upgraded **GlossCut** with professional legal compliance and an automated security pipeline.

## 1. Legal Compliance (GDPR / DPDP)

### 🔒 Privacy Policy (`/privacy`)
*   **Location:** `main-website/src/components/PrivacyPolicy.jsx`
*   **Status:** ✅ **Up to Date**
*   **Key Features:**
    *   Explicitly lists data collection (Camera, Location, Payments).
    *   Identifies third-party processors (Razorpay, Firebase).
    *   Includes mandatory "Contact Us" section.
    *   Compliant with Google Play Store & Apple App Store policies.

### 📜 Terms of Service (`/terms`)
*   **Location:** `main-website/src/components/TermsOfService.jsx`
*   **Status:** ✅ **Up to Date**
*   **Key Features:**
    *   **Governing Law:** Set to **Nagpur, Maharashtra**, protecting you legally.
    *   **Liability:** "As-Is" clauses to limit your risk.
    *   **Role:** Clearly defines GlossCut as an *intermediary*, not a salon.

### 🍪 Cookie Consent Banner
*   **Location:** Global Overlay (Appears on all pages)
*   **Status:** ✅ **Active**
*   **Behavior:**
    *   Appears after 1.5s for new users.
    *   Remembers explicit Consent (Accept/Decline) via `localStorage`.
    *   Required for running Analytics/Ads in India & Europe.

---

## 2. Automated Security Pipeline (CI/CD)

### 🛡️ GitHub Security Audit
*   **File:** `.github/workflows/security-audit.yml`
*   **Status:** ✅ **Active** (Runs on every Push)
*   **What it does:**
    *   Automatically scans your `backend`, `frontend`, and `apps`.
    *   Checks for **High Severity** vulnerabilities in dependencies.
    *   **Green Tick ✅** = Safe.
    *   **Red X ❌** = Vulnerability found (Action required).

### 🚨 Fixing Vulnerabilities (Troubleshooting)

We found some vulnerabilities in `react-scripts`. I have applied a patch (Overrides) to your `package.json` files, but you need to finalize it.

#### If you see `EPERM: operation not permitted` errors:
This means Windows is locking your project files.
**Solution:**
1.  **Restart VS Code** (Close all windows and reopen).
2.  Open the terminal and run:
    ```powershell
    # For Main Website
    cd main-website
    npm install

    # For Admin Panel
    cd ../admin-panel
    npm install
    ```
3.  Once the installation succeeds, verify the security status:
    ```powershell
    git add .
    git commit -m "Fix security overrides"
    git push origin main
    ```
4.  Go to your GitHub "Actions" tab to see the **Green Tick**.
