import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter } from 'k6/metrics';

// Đếm lỗi tùy chỉnh
const errors = new Counter('errors');

// Cấu hình Spike Test
export const options = {
    stages: [
        { duration: '10s', target: 10 }, 
        { duration: '10s', target: 100 },   // Tăng đột ngột (spike)
        { duration: '20s', target: 500 },   // Giữ tải cao trong 20s
        { duration: '10s', target: 0 },     // Giảm tải để quan sát hồi phục
  ],
  // Kết quả mong đợi (ngưỡng hiệu năng)
    thresholds: {
        http_req_duration: ['p(95)<1000'],  // 95% request < 1s
        http_req_failed: ['rate<0.05'],     // Tỷ lệ lỗi < 5%
    },
};

// Hàm kiểm thử chính
export default function () {
    const url = 'https://velvere.vercel.app/';
    const res = http.get(url);

    // Kiểm tra kết quả phản hồi
    const ok = check(res, {
        'status is 200': (r) => r.status === 200,
        'response < 1000ms': (r) => r.timings.duration < 1000,
    });

    if (!ok) {
        errors.add(1);
        console.error(
            `Request failed | Status: ${res.status} | Duration: ${res.timings.duration}ms`,
        );
    }

    // Nghỉ ngẫu nhiên giữa các request
    sleep(Math.random() + 0.5);
}

// Chạy với dashboard
//    K6_WEB_DASHBOARD=true K6_WEB_DASHBOARD_EXPORT=reports/Spike_Test.html k6 run Spike_Test.js
// Chạy không có dashboard
//    k6 run Spike_Test.js