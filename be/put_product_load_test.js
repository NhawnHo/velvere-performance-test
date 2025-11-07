import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter } from 'k6/metrics';

const errors = new Counter('errors');

export const options = {
    stages: [
        { duration: '10s', target: 10 },
        { duration: '20s', target: 50 },
        { duration: '20s', target: 100 },
        { duration: '10s', target: 0 },
    ],
    // Kết quả mong đợi (ngưỡng hiệu năng)
    thresholds: {
        http_req_duration: ['p(95)<1000'],
        http_req_failed: ['rate<0.05'],
    },
};

export default function () {
    const productId = '6811e549e0b581722891cd10';
    const url = `https://velvereserver-production-03e2.up.railway.app/api/products/${productId}`;

    const payload = JSON.stringify({
        product_id: '1',
        product_name: `Áo len cashmere cập nhật ${Math.floor(
            Math.random() * 100,
        )}`,
        description:
            'Áo len cashmere mới với thiết kế tinh tế, sang trọng. Giữ ấm tốt và nhẹ nhàng, phù hợp phong cách thanh lịch mùa đông.',
        category_id: 'aolen',
        sex: 'Nữ',
        images: [
            'https://res.cloudinary.com/dnbc9k0yn/image/upload/v1748868125/LOOK_F_25_3_LOOK_075_E08_lomrey.jpg',
            'https://res.cloudinary.com/dnbc9k0yn/image/upload/v1748868096/544S37A0020X9000_E01_dfbjp1.jpg',
            'https://res.cloudinary.com/dnbc9k0yn/image/upload/v1748868135/LOOK_F_25_3_LOOK_075_E01-1_tm8ktp.jpg',
        ],
        price: 9500000,
        xuatXu: 'Pháp',
        chatLieu: 'Len cashmere',
        variants: [
            { size: 'S', color: 'Đen', stock: 85 },
            { size: 'M', color: 'Đen', stock: 90 },
            { size: 'L', color: 'Đen', stock: 120 },
        ],
        updatedAt: new Date().toISOString(),
    });

    const params = {
        headers: { 'Content-Type': 'application/json' },
    };

    const res = http.put(url, payload, params);

    const ok = check(res, {
        'status is 200 or 201': (r) => r.status === 200 || r.status === 201,
        'response < 1000ms': (r) => r.timings.duration < 1000,
    });

    if (!ok) {
        console.error(`Update lỗi! Status: ${res.status}, Body: ${res.body}`);
        errors.add(1);
    }

    sleep(1);
}

// Chạy với dashboard
//    K6_WEB_DASHBOARD=true K6_WEB_DASHBOARD_EXPORT=reports/put_product_load_test.html k6 run put_product_load_test.js
// Chạy không có dashboard
//    k6 run put_product_load_test.js
