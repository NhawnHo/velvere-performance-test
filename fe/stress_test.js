import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter } from 'k6/metrics';

// Đếm lỗi tùy chỉnh
const errors = new Counter('errors');

// Cấu hình Stress Test
export const options = {
    stages: [
        { duration: '20s', target: 100 },
        { duration: '30s', target: 300 }, // Tăng nhanh tải
        { duration: '30s', target: 600 }, // Tải cao
        { duration: '30s', target: 1000 }, // Cực đại - ép hệ thống
        { duration: '10s', target: 0 }, // Giảm tải dần
    ],
    // Kết quả mong đợi (ngưỡng hiệu năng)
    thresholds: {
        http_req_duration: ['p(95)<1500'], // 95% request < 1.5s
        http_req_failed: ['rate<0.1'], // Tỷ lệ lỗi < 10%
    },
};

// Hàm test chính
export default function () {
    const url = 'https://velvere.vercel.app/';
    const res = http.get(url);

    // Kiểm tra phản hồi
    const ok = check(res, {
        'status is 200': (r) => r.status === 200,
        'response < 1500ms': (r) => r.timings.duration < 1500,
    });

    if (!ok) {
        errors.add(1);
        console.error(
            `Lỗi request - status: ${res.status}, time: ${res.timings.duration}ms`,
        );
    }

    // Nghỉ ngẫu nhiên giữa các request
    sleep(Math.random() * 1 + 0.5);
}

// Chạy với dashboard
//    K6_WEB_DASHBOARD=true K6_WEB_DASHBOARD_EXPORT=reports/stress_test.html k6 run stress_test.js
// Chạy không có dashboard
//    k6 run stress_test.js