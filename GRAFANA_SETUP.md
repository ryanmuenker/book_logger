# Grafana Setup Guide

## Quick Start

1. **Access Grafana**: http://localhost:3000
   - Username: `admin`
   - Password: `admin`
   - (You'll be prompted to change the password on first login)

2. **Add Prometheus Data Source**:
   - Click "Add your first data source" or go to Configuration → Data Sources
   - Select "Prometheus"
   - Set URL: `http://prometheus:9090` (or `http://localhost:9090` if running outside Docker)
   - Click "Save & Test"

3. **Explore Metrics**:
   - Go to Explore (compass icon on left)
   - Select Prometheus as data source
   - Try queries like:
     - `rate(http_requests_total[5m])` - Request rate
     - `rate(http_requests_total{status=~"5.."}[5m])` - Error rate
     - `histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))` - 95th percentile latency

## Useful Metrics from Your Flask App

- `http_requests_total` - Total request count by method and status
- `http_request_duration_seconds` - Request latency histogram
- `flask_exceptions_total` - Error count by exception type
- `app_info` - Application version info

## Create a Dashboard

1. Go to Dashboards → New Dashboard
2. Add Panel → Add Visualization
3. Select Prometheus data source
4. Enter a query (e.g., `rate(http_requests_total[5m])`)
5. Save the dashboard

