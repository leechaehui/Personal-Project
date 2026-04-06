import os
import numpy as np
import tensorflow as tf
from tensorflow.keras.applications.vgg16 import VGG16, preprocess_input
from tensorflow.keras.preprocessing import image
from sklearn.metrics.pairwise import cosine_similarity

# 앱 환경에 맞는 기준 경로 설정
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
REF_PATH = os.path.join(BASE_DIR, 'reference')

# 기준 폴더가 없으면 생성
if not os.path.exists(REF_PATH):
    os.makedirs(REF_PATH)

# VGG16 모델 로드 (앱 기동 시 한 번만 로드하여 속도 향상)
try:
    print("VGG16 모델 로딩 중...")
    model = VGG16(weights='imagenet', include_top=False, pooling='avg')
    print("VGG16 모델 성공적으로 로딩됨.")
except Exception as e:
    print(f"모델 로딩 실패: {e}")
    model = None

def get_features(img_path):
    if model is None:
        return None
    # 이미지 로드 및 전처리
    img = image.load_img(img_path, target_size=(224, 224))
    x = image.img_to_array(img)
    x = np.expand_dims(x, axis=0)
    x = preprocess_input(x)

    features = model.predict(x, verbose=0)
    return features.flatten()

def load_reference_features():
    disease_features = {}
    if not os.path.exists(REF_PATH):
        return disease_features

    for disease in os.listdir(REF_PATH):
        disease_dir = os.path.join(REF_PATH, disease)
        if os.path.isdir(disease_dir):
            vectors = []
            for f in os.listdir(disease_dir):
                if f.lower().endswith(('.jpg', '.png', '.jpeg')):
                    feat = get_features(os.path.join(disease_dir, f))
                    if feat is not None:
                        vectors.append(feat)
            if vectors:
                disease_features[disease] = np.mean(vectors, axis=0)
    return disease_features

# 서버 구동 시 참조 이미지 특징 미리 계산
print("기준 이미지(Reference) 특징 추출 시작...")
disease_features = load_reference_features()
print(f"특징 추출 완료: 총 {len(disease_features)}개의 질환 카테고리가 등록되었습니다.")

def analyze_image(file_paths):
    """
    여러 이미지 경로를 받아 평균 특징을 계산한 뒤, 
    기준 질환 이미지들과 코사인 유사도를 구하여 반환
    """
    # 만약 reference 데이터가 비어있다면 데모용 더미 결과를 반환합니다.
    if not disease_features or model is None:
        print("참조 데이터가 없거나 모델이 없습니다. 더미 데이터를 반환합니다.")
        return [
            {"disease": "eczema (습진/더미)", "score": 82.4},
            {"disease": "psoriasis (건선/더미)", "score": 12.1},
            {"disease": "acne (여드름/더미)", "score": 4.2},
            {"disease": "hives (두드러기/더미)", "score": 1.3}
        ]
    
    total_scores = {disease: 0 for disease in disease_features.keys()}
    num_photos = 0
    
    for paths in file_paths:
        my_vector = get_features(paths)
        if my_vector is None:
            continue
        
        my_vector = my_vector.reshape(1, -1)
        num_photos += 1
        
        for disease, ref_vector in disease_features.items():
            sim = cosine_similarity(my_vector, ref_vector.reshape(1, -1))[0][0]
            total_scores[disease] += sim
            
    if num_photos == 0:
        return []

    disease_names_map = {
        "atopy": "아토피 (Atopy)",
        "dermo": "묘기증 (Dermographism)",
        "psoriasis": "건선 (Psoriasis)"
    }

    # 점수 평균 계산
    results = []
    for disease, total_sim in total_scores.items():
        avg_score = float(total_sim) / num_photos
        # 0~1 범위를 퍼센티지로 변환, 음수가 나오는 경우도 방지
        percent_score = max(0, min(100, avg_score * 100))
        results.append({
            "disease": disease_names_map.get(disease, disease),
            "score": round(percent_score, 1)
        })
        
    # 유사도가 높은 순으로 정렬
    results = sorted(results, key=lambda x: x["score"], reverse=True)
    return results
