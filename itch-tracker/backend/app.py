import os
import tempfile
from flask import Flask, request, jsonify
from flask_cors import CORS
from ml_model import analyze_image

app = Flask(__name__)
# 프론트엔드에서의 접근 허용
CORS(app)

@app.route('/api/analyze', methods=['POST'])
def analyze_api():
    if 'image' not in request.files:
        return jsonify({"error": "이미지 파일이 전송되지 않았습니다."}), 400

    files = request.files.getlist('image')
    
    # 여러 파일을 임시 디렉토리에 저장 후 처리
    valid_paths = []
    
    with tempfile.TemporaryDirectory() as tmpdirname:
        for file in files:
            if file.filename:
                # 임시 파일 경로 저장
                temp_path = os.path.join(tmpdirname, file.filename)
                file.save(temp_path)
                valid_paths.append(temp_path)
        
        if not valid_paths:
            return jsonify({"error": "유효한 이지지 파일이 없습니다."}), 400
        
        # 모델을 통한 점수 분석
        try:
            results = analyze_image(valid_paths)
            return jsonify({
                "results": results
            })
        except Exception as e:
            print(f"Error during analysis: {e}")
            return jsonify({"error": f"분석 중 오류 발생: {str(e)}"}), 500

if __name__ == '__main__':
    # 5000 포트에서 실행
    app.run(host='0.0.0.0', port=5000, debug=True)
