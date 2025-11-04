# UFace-USTH_FaceID/server.py

import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import psycopg2
from dotenv import load_dotenv

# Tải biến môi trường
load_dotenv()

# --- Cấu hình Flask và DB ---
app = Flask(__name__)
# Cho phép frontend (có thể chạy trên cổng khác) truy cập API
CORS(app)


def get_db_connection():
    """Tạo và trả về kết nối tới PostgreSQL."""
    try:
        conn = psycopg2.connect(
            host=os.getenv("DB_HOST"),
            database=os.getenv("DB_DATABASE"),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD"),
            port=os.getenv("DB_PORT"),
        )
        return conn
    except psycopg2.Error as e:
        # Xử lý nếu kết nối DB thất bại
        print(f"Lỗi kết nối database: {e}")
        # Reraise để Flask biết có lỗi nghiêm trọng
        raise


# --- Định nghĩa Endpoint Đăng ký ---
@app.route("/api/register", methods=["POST"])
def register():
    # 1. Nhận dữ liệu từ FormData (request.form)
    # LƯU Ý: Frontend gửi dữ liệu dưới dạng FormData, không phải JSON
    data_form = request.form

    # 2. Lấy dữ liệu văn bản theo tên trường trong frontend
    full_name = data_form.get("full_name")
    student_id = data_form.get("student_id")
    student_email = data_form.get("school_email")  # Frontend dùng school_email

    # Lấy file ảnh (Bỏ qua việc lưu trữ file ảnh TẠM THỜI)
    # files = request.files
    # print(f"Nhận được {len(files)} file ảnh.")

    # 3. Xác thực dữ liệu cơ bản
    if not all([full_name, student_id, student_email]):
        return (
            jsonify({"error": "Vui lòng điền đầy đủ thông tin (Họ tên, ID, Email)."}),
            400,
        )

    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        # 4. Chuẩn bị và Thực thi truy vấn INSERT
        insert_query = """
            INSERT INTO students (full_name, student_id, student_email)
            VALUES (%s, %s, %s)
            RETURNING student_id;
        """
        values = (full_name, student_id, student_email)
        cur.execute(insert_query, values)
        conn.commit()

        # 5. Phản hồi thành công
        cur.close()
        return jsonify({"message": "Đăng ký thành công!", "studentID": student_id}), 201

    except psycopg2.errors.UniqueViolation:
        return (
            jsonify(
                {
                    "error": "Thông tin đã tồn tại. Student ID hoặc Email đã được đăng ký."
                }
            ),
            409,
        )

    except Exception as e:
        print(f"Lỗi xảy ra khi xử lý đăng ký: {e}")
        return jsonify({"error": "Lỗi server nội bộ."}), 500

    finally:
        if conn:
            conn.close()


# --- Khởi động Server ---
if __name__ == "__main__":
    # Flask sẽ chạy trên cổng 5000 (hoặc cổng cấu hình trong .env)
    app.run(host="0.0.0.0", port=os.getenv("PORT", 5000))
