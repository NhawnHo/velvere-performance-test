import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
    stages: [
        { duration: '10s', target: 50 },
        { duration: '20s', target: 150 },
        { duration: '30s', target: 400 },
        { duration: '10s', target: 0 },
    ],
    // Kết quả mong đợi (ngưỡng hiệu năng)
    thresholds: {
        http_req_duration: ['p(95)<1000'],    // 95% request phải < 1s
        http_req_failed: ['rate<0.05'],       // lỗi < 5%
    },
};

export default function () {
  const url =
      'https://velvereserver-production-03e2.up.railway.app/api/products';
  const payload = JSON.stringify({
    title: `Áo Hoodie Street Style ${Math.random().toString(36).substring(2, 6)}`,
    price: 299.99,
    description: "Hoodie phong cách đường phố, thoáng mát và thời trang.",
    image: "https://fakestoreapi.com/img/81fPKd-2AYL._AC_SL1500_t.png",
    category: "men's clothing",
  });

  const params = { headers: { 'Content-Type': 'application/json' } };
  const res = http.post(url, payload, params);

  check(res, {
    'status is 200 or 201': (r) => r.status === 200 || r.status === 201,
    'response time < 1000ms': (r) => r.timings.duration < 1000,
  });

  sleep(Math.random() + 0.5);
}

// Chạy với dashboard
//    K6_WEB_DASHBOARD=true K6_WEB_DASHBOARD_EXPORT=reports/post_products_stress_test.html k6 run post_products_stress_test.js
// Chạy không có dashboard
//    k6 run post_products_stress_test.js
