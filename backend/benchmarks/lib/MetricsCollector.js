/**
 * Metrics Collector
 * Aggregates performance data from all bots.
 */

class MetricsCollector {
    constructor() {
        this.requests = {
            total: 0,
            success: 0,
            fail: 0
        };
        this.latencies = []; // Array of response times in ms
        this.errors = {}; // Map of error types to counts
        this.startTime = Date.now();
    }

    record(latency, isSuccess, errorMsg = null) {
        this.requests.total++;
        if (isSuccess) {
            this.requests.success++;
        } else {
            this.requests.fail++;
            if (errorMsg) {
                const key = errorMsg.toString().slice(0, 50); // Group by first 50 chars
                this.errors[key] = (this.errors[key] || 0) + 1;
            }
        }
        this.latencies.push(latency);
    }

    getSnapshot() {
        const now = Date.now();
        const durationSec = (now - this.startTime) / 1000;

        // Sort latencies for percentiles
        this.latencies.sort((a, b) => a - b);
        const count = this.latencies.length;

        return {
            durationSeconds: durationSec.toFixed(2),
            throughputRPS: (this.requests.total / durationSec).toFixed(2),
            totalRequests: this.requests.total,
            successRate: ((this.requests.success / (this.requests.total || 1)) * 100).toFixed(2) + '%',
            errorCount: this.requests.fail,
            latency: {
                min: count ? this.latencies[0] : 0,
                max: count ? this.latencies[count - 1] : 0,
                avg: count ? (this.latencies.reduce((a, b) => a + b, 0) / count).toFixed(0) : 0,
                p50: count ? this.latencies[Math.floor(count * 0.5)] : 0, // Median
                p95: count ? this.latencies[Math.floor(count * 0.95)] : 0, // 95th Percentile
                p99: count ? this.latencies[Math.floor(count * 0.99)] : 0  // 99th Percentile
            },
            topErrors: Object.entries(this.errors)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 3) // Top 3 errors
        };
    }
}

module.exports = new MetricsCollector(); // Singleton instance
