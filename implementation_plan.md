# CI/CD Pipeline Enhancement Plan

## Goal
Enhance the existing `security-audit.yml` to not only scan for vulnerabilities but also verify that the application code **builds** successfully. This creates a true "Secure Pipeline" that ensures both safety and stability.

## User Review Required
> [!NOTE]
> **Wait Time Calculation Change**: Shifting to a **Group-Based Sequential** model. 
> **The Active Cluster Rule**: If multiple appointments are `started`, their combined remaining time is reduced to 75%.
> **Sequential Queue**: All appointments in the queue (not yet started) are calculated at 100% duration, added sequentially after the Active Cluster finishes. This ensures wait times only improve when the barber *actually* clicks "START" on parallel clients.
> This change will increase the time it takes for GitHub Checks to complete (as it will actually compile the apps). This is a standard trade-off for better reliability.

## Proposed Changes

### GitHub Workflows
#### [MODIFY] [.github/workflows/security-audit.yml](file:///c:/Users/Bhagyashree/OneDrive/Desktop/SetKarr/.github/workflows/security-audit.yml)
- Add a new job `build-verification` that runs in parallel or after `npm-audit`.
- It will run `npm run build` (or `npm run web` for Expo apps if applicable) for:
    - `backend` (Verify syntax/imports)
    - `admin-panel` (React Build)
    - `main-website` (React Build)
    - `barber-app` & `customer-app` (Expo Type Check / Dry Run)

## Verification Plan

### Automated Verification
- Push the changes to GitHub.
- Observe the "Actions" tab.
- Verify that a new "Build Verification" job appears and typically passes (Green Tick).
- If it fails, it means we have broken code, which is exactly what we want to catch!

### Manual Verification
- None required locally; the GitHub Action *is* the verifier.
