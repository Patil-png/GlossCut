# 🌐 DNS Security Setup Guide

To fully secure your domain (`setkarr.com` or `glosscut.com`) and prevent email spoofing, you must add these records to your **Domain Registrar** (e.g., GoDaddy, Namecheap, Vercel).

> [!IMPORTANT]
> These changes are made in your **Domain Dashboard**, not in the code.

## 1. SPF Record (Sender Policy Framework)
*Prevents hackers from sending fake emails pretending to be you.*

**Action:** Add a **TXT** record.
- **Type:** `TXT`
- **Name/Host:** `@` (or leave blank)
- **Value:** `v=spf1 include:_spf.google.com ~all`
    - *Note: Replace `_spf.google.com` with `spf.protection.outlook.com` if using Microsoft 365, or `spf.zoho.in` for Zoho.*

## 2. DMARC Record (Domain-based Message Authentication)
*Tells email providers to reject fake emails sent from your domain.*

**Action:** Add a **TXT** record.
- **Type:** `TXT`
- **Name/Host:** `_dmarc`
- **Value:** `v=DMARC1; p=quarantine; rua=mailto:admin@glosscut.com`
    - `p=quarantine`: Send suspicious emails to spam. (Change to `p=reject` for maximum security later).
    - `rua`: Where to send security reports.

## 3. DKIM (DomainKeys Identified Mail)
*Adds a digital signature to your emails.*

**Action:** You must generate this in your Email Admin Panel.
1.  Go to **Google Workspace Admin** > **Apps** > **Gmail** > **Authenticate email (DKIM)**.
2.  Click **Generate new record**.
3.  Copy the long text string it gives you.
4.  Add it to your DNS as a **TXT** record (Host: `google._domainkey`, Value: `[Long Key]`).

## 4. DNSSEC (DNS Security Extensions)
*Prevents DNS hijacking.*

**Action:** Toggle a switch.
1.  Go to your Domain Registrar (GoDaddy/Namecheap).
2.  Find **DNSSEC** in settings.
3.  Turn it **ON**.
    - *Note: If using Vercel DNS, this is often automatic or requires Cloudflare.*
