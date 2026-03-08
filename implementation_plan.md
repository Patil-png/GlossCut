# CI/CD Pipeline Enhancement Plan

## Goal
Enhance the existing `security-audit.yml` to not only scan for vulnerabilities but also verify that the application code **builds** successfully. This creates a true "Secure Pipeline" that ensures both safety and stability.

## User Review Required
> [!NOTE]
> **Wait Time Calculation Change**: The wait time algorithm will shift from a single-queue model (summing all durations) to a multi-slot model.
> **75% Efficiency Rule**: To account for parallel service overhead, the "effective" duration in the queue will be calculated as `IndividualDuration * (Capacity * 0.75)`. This ensures that doing two 30m services parallel results in a 45m wait for the next person (75% of sequential sum).
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
