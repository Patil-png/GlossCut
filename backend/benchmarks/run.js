/**
 * GlossCut/SetKarr Capacity Benchmark Orchestrator
 * 
 * Usage: node backend/benchmarks/run.js [users] [barbers] [duration_seconds] [base_url]
 * Default: 50 users, 5 barbers, 30 seconds, http://localhost:3000/api
 */

const UserBot = require('./lib/UserBot');
const BarberBot = require('./lib/BarberBot');
const metrics = require('./lib/MetricsCollector');
const rand = require('./utils/randomizers');

// Configuration
const USERS_COUNT = process.argv[2] ? parseInt(process.argv[2]) : 50;
const BARBERS_COUNT = process.argv[3] ? parseInt(process.argv[3]) : 5;
const DURATION_SEC = process.argv[4] ? parseInt(process.argv[4]) : 30;
const TARGET_URL = process.argv[5] || 'http://localhost:3000/api';

console.log(`
======================================================
  GLOSSCUT CAPACITY BENCHMARK
======================================================
  Users:   ${USERS_COUNT}
  Barbers: ${BARBERS_COUNT}
  Duration: ${DURATION_SEC}s
  Target:  ${TARGET_URL}
======================================================
`);

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

(async () => {
    // 1. Initialize Barbers (Providers)
    console.log('>>> Initializing Barbers...');
    const barbers = [];
    for (let i = 0; i < BARBERS_COUNT; i++) {
        const barber = new BarberBot(i, TARGET_URL);
        try {
            await barber.setup();
            barbers.push(barber);
            process.stdout.write('.');
        } catch (e) {
            console.log('x', e.message, e.response?.data);
        }
    }
    console.log(`\n>>> ${barbers.length} Barbers Ready.`);

    if (barbers.length === 0) {
        console.error('CRITICAL: No barbers could be initialized. Is backend running?');
        process.exit(1);
    }

    // 2. Initialize Users (Consumers)
    console.log('>>> Initializing Users...');
    const users = [];
    for (let i = 0; i < USERS_COUNT; i++) {
        const user = new UserBot(i, TARGET_URL);
        await user.runDelay(); // Stagger start
        try {
            await user.register();
            await user.login();
            users.push(user);
        } catch (e) {
            // Login failed (maybe rate limited?)
        }
    }
    console.log(`>>> ${users.length} Users Logged In.`);

    // 3. Run Mixed Loop
    console.log('\n>>> STARTING LOAD TEST...');
    const endTime = Date.now() + (DURATION_SEC * 1000);

    // Dashboard Update Loop
    const printDashboard = setInterval(() => {
        const snapshot = metrics.getSnapshot();
        console.clear();
        console.log(`
---- LIVE METRICS (${Math.floor((endTime - Date.now()) / 1000)}s remaining) ----
 Requests:    ${snapshot.totalRequests}
 Success:     ${snapshot.successRate}
 Throughput:  ${snapshot.throughputRPS} RPS
 Latency:     avg=${snapshot.latency.avg}ms p95=${snapshot.latency.p95}ms
 Errors:      ${snapshot.errorCount}
 Top Errors:  ${JSON.stringify(snapshot.topErrors)}
---------------------------------------------
    `);
    }, 1000);

    // User Traffic Loop
    const userTraffic = users.map(async (user) => {
        while (Date.now() < endTime) {
            const randomBarber = rand.pick(barbers);
            if (randomBarber && randomBarber.barberId) {
                await user.browseAndBook(randomBarber.barberId);
            }
            await rand.sleep(2000, 5000); // 2-5s pause between actions
        }
    });

    // Barber Traffic Loop (Checking Bookings)
    const barberTraffic = barbers.map(async (barber) => {
        while (Date.now() < endTime) {
            await barber.checkBookings();
            await rand.sleep(3000, 6000); // Check bookings every 3-6s
        }
    });

    await Promise.all([...userTraffic, ...barberTraffic]);

    clearInterval(printDashboard);

    // 4. Final Report
    const snapshot = metrics.getSnapshot();
    console.log(`
======================================================
  FINAL REPORT
======================================================
  Duration:    ${snapshot.durationSeconds}s
  Total Req:   ${snapshot.totalRequests}
  Throughput:  ${snapshot.throughputRPS} req/sec
  Success Rate:${snapshot.successRate}
  
  Latency (ms):
    Min: ${snapshot.latency.min}
    Avg: ${snapshot.latency.avg}
    Max: ${snapshot.latency.max}
    P95: ${snapshot.latency.p95}
    
  Errors: ${snapshot.errorCount}
======================================================
  INTERPRETATION FOR FREE TIER:
  - If P95 Latency > 1000ms: CPU/DB is struggling.
  - If Throughput > 50 RPS: Excellent for Free Tier.
  - If Errors > 1%: Check logs (Rate Limits might be hitting).
======================================================
`);

})();
