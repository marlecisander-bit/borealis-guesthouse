# Local-only booking fixture harness

This tooling is outside src/public and never provides a Next route. It builds a private standalone HTML file from the actual BookingFlow, its hooks/components, actual bookingService, occupancy/allocation and pricing code. It includes only synthetic inventory/transport and no Supabase/SSR/provider module. Production/hosting/credential-bearing generator environments are refused; the HTML refuses hosted HTTP origins. Do not copy it into public/ or a deployment.

From the canonical repository:

```sh
python3 tools/booking-fixture/run.py test --fixtures-only
```

This compiles the bundle and runs ephemeral headless Chrome desktop/mobile checks without an HTTP server. IP outbound, inbound and bind operations are denied. Chrome's local Unix-domain IPC remains available. Negative loopback/external-connect/listener controls must fail with permission errors before browser execution. Browser context routing aborts every actual request. All fixture fetch calls remain in memory, and CSP/native-API guards provide additional fail-closed layers. No sessions are imported. It does not open a persistent interface.

After separately authorizing interactive startup:

```sh
python3 tools/booking-fixture/run.py open --fixtures-only --allow-interactive-start
```

The prepared startup procedure requires exact manifest/source identity and matching passing headless HTML acceptance, then opens only the local file in a separate empty Chrome profile under the deny-IP policy. It starts no server, does not use port3000 or alter the restricted preview, inherits no dotenv/provider credentials and does not use production Auth. Do not double-click the HTML in a normal production-signed-in browser as a substitute for this procedure. Close the dedicated fixture window when finished; do not terminate other Chrome/server processes by name or port.

The example dates are16–20November2026 with2 adults; the test clock is pinned to21October2026. Select fixture scenarios to try six adults/multiple rooms, no availability, pricing/hold/confirmation failure. Use fictional guest details only. The double's synthetic four-night total is EUR360 (80+80+100+100). Confirmation reference FICTIONAL-BOREALIS-0001 and cancellation exist only in browser memory. Reset discards state. Cancellation is a harness-only control, not a production self-service feature. The fixture is not a substitute for SQL concurrency, actual availability, idempotency, provider or reservation acceptance.

Artifacts and screenshots remain ignored under .local/booking-fixture-v1/. The startup command has been prepared but not invoked by the preparation task. Never enable booking endpoints in the read-only preview to use this harness.
