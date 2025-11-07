import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter } from 'k6/metrics';

// Đếm lỗi tùy chỉnh
const errors = new Counter('errors');

// Cấu hình test
export const options = {
    stages: [
        { duration: '10s', target: 10 },
        { duration: '30s', target: 50 },    // giữ tải ổn định
        { duration: '10s', target: 0 },     // sau đó hạ tải
    ],
    // Kết quả mong đợi (ngưỡng hiệu năng)
    thresholds: {
        http_req_duration: ['p(95)<900'],   // 95% request < 900ms
        http_req_failed: ['rate<0.02'],     // lỗi < 2%
    },
};

// API
const BASE_URL =
    'https://velvereserver-production-03e2.up.railway.app/api/products';

export default function () {
  const res = http.get(BASE_URL);

  // Kiểm tra phản hồi
  const ok = check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 900ms': (r) => r.timings.duration < 900,
  });

  if (!ok) {
    errors.add(1);
    console.error(
      `Lỗi: status ${res.status} - thời gian ${res.timings.duration}ms`,
    );
  }

  // Người dùng nghỉ
  sleep(Math.random() + 0.5);
}

// Chạy với dashboard
//  git bash:    K6_WEB_DASHBOARD=true K6_WEB_DASHBOARD_EXPORT=reports/get_products_load_test.html k6 run get_products_load_test.js
//  powershell:  $env:K6_WEB_DASHBOARD = "true" $env:K6_WEB_DASHBOARD_EXPORT = "reports/get_products_load_test.html"; k6 run get_products_load_test.js
// Chạy không có dashboard
//    k6 run get_products_load_test.js