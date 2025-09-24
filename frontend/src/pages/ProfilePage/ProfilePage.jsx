import { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./ProfilePage.css";
import Loading from "../global/loading";

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState("view");
  const [profile, setProfile] = useState(null);
  const [nicknameInput, setNicknameInput] = useState("");
  const [nicknameError, setNicknameError] = useState(""); // 닉네임 중복 에러 메시지
  const [email, setEmail] = useState("");
  const [age, setAge] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [gender, setGender] = useState("male");
  const [activityLevel, setActivityLevel] = useState(null);

  const [tempProfileImage, setTempProfileImage] = useState(null);
  const fileInputRef = useRef(null);

  const ImageUrlPath = "/images/profile-images/";
  const DEFAULT_IMAGE = "/images/profile-images/default.png";

  const providerUrlPath = "/images/OAuthProviderLogos/"
  const providerLogos = {
  GOOGLE: providerUrlPath + "google.png",
  KAKAO: providerUrlPath + "kakaotalk.png",
  NAVER: providerUrlPath + "naver.png"
};

  // --- 프로필 불러오기 ---
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const bodyRes = await axios.get("http://localhost:8080/profile", { withCredentials: true });
        const accountRes = await axios.get("http://localhost:8080/api/auth/me", { withCredentials: true });
        const combined = { ...bodyRes.data, ...accountRes.data };

        setProfile(combined);
        setAge(combined.age ?? "");
        setHeight(combined.height ?? "");
        setWeight(combined.weight ?? "");
        setGender(combined.gender?.toLowerCase() ?? "male");
        setActivityLevel(combined.activityLevel ?? null);
        setEmail(combined.email || "");
        setNicknameInput(combined.nickname || "");
        setTempProfileImage(combined.profileImageUrl || DEFAULT_IMAGE);
      } catch (err) {
        console.error(err);
        alert("프로필 정보를 불러오지 못했습니다.");
      }
    };
    fetchProfile();
  }, []);

  // --- 이미지 변경 ---
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) setTempProfileImage(URL.createObjectURL(file));
  };

  const handleImageUpload = () => fileInputRef.current.click();

  // --- 저장 ---
  const handleSaveAllProfiles = async () => {
    if (height < 100 || height > 250) return alert("키는 100cm 이상, 250cm 이하로 입력해주세요.");
    if (!activityLevel) return alert("활동 레벨을 선택해주세요.");
    if (!nicknameInput) return alert("닉네임을 입력해주세요.");

    try {
      let finalProfileImage = tempProfileImage;

      // 새 파일 업로드
      if (fileInputRef.current.files[0]) {
        // 새 파일을 선택했다면 파일 이름만 문자열로 처리
        const file = fileInputRef.current.files[0];
        // // 서버에 저장될 고유 파일명 문자열 (ex: "1695481234567_filename.png")
        // const uniqueFileName = Date.now() + "_" + file.name;
        // uniqueFileName으로 이미지 로컬에 저장할 부분
        finalProfileImage = ImageUrlPath + file.name;
      }

      // 닉네임 저장
      await axios.patch(
        "http://localhost:8080/api/auth/nickname",
        { nickname: nicknameInput },
        { withCredentials: true }
      );

      // 나머지 정보 저장
      await axios.put(
        "http://localhost:8080/profile/edit",
        {
          age: Number(age),
          height: Number(height).toFixed(1),
          weight: Number(weight).toFixed(2),
          gender: gender.toUpperCase(),
          activityLevel: Number(activityLevel),
          profileImageUrl: finalProfileImage || DEFAULT_IMAGE,
        },
        { withCredentials: true }
      );

      // BMI 계산(height 또는 weight 변경 시에만)
      if (
        Number(height).toFixed(1) !== Number(profile.height).toFixed(1) ||
        Number(weight).toFixed(2) !== Number(profile.weight).toFixed(2)
      ) {
        await axios.post(
          "http://localhost:8080/calc/bmi",
          null,
          { params: { userId: profile.userId }, withCredentials: true }
        );
      }

      // 상태 업데이트
      const updatedProfile = {
        ...profile,
        age,
        height,
        weight,
        gender: gender.toUpperCase(),
        activityLevel,
        nickname: nicknameInput,
        profileImageUrl: finalProfileImage,
      };
      setProfile(updatedProfile);
      setTempProfileImage(finalProfileImage);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setActiveTab("view");
      alert("프로필이 저장되었습니다.");
    } catch (err) {
      console.error(err.response?.data || err);

      if (err.response?.status === 400 && err.response?.data) {
        // 닉네임 중복 같은 에러 → 입력칸 밑에 표시
        setNicknameError(err.response.data);
      } else {
        // 그 외 에러 → alert
        alert("프로필 저장 중 오류가 발생했습니다.");
      }
    }
  };

  const handleCancelEdit = () => {
    // 이전에 생성한 URL 해제
    if (fileInputRef.current?.files[0]) {
      URL.revokeObjectURL(tempProfileImage);
      fileInputRef.current.value = "";
    }
    setTempProfileImage(profile.profileImageUrl || DEFAULT_IMAGE);
    setNicknameInput(profile.nickname || "");
    setAge(profile.age ?? "");
    setHeight(profile.height ?? "");
    setWeight(profile.weight ?? "");
    setGender(profile.gender?.toLowerCase() ?? "male");
    setActivityLevel(profile.activityLevel ?? null);
    setActiveTab("view");
  };

  // --- 로딩 중 표시 ---
  if (!profile) return <Loading />;

  return (
    <div className="profilePage">
      <aside className="sidebar">
        <div className={activeTab === "view" ? "active" : ""} onClick={() => setActiveTab("view")}>
          프로필 설정
        </div>
      </aside>

      <main className="mainContent">
        <h2>프로필 설정</h2>

        {activeTab === "view" && (
          <div className="profileContainer">
            <div className="profileHeader">
              {/* 프로필 이미지 */}
              <img src={profile.profileImageUrl || DEFAULT_IMAGE} alt="profile" className="profileImage" />
              {/* 닉네임 및 이메일 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <p className="nicknameText">{profile.nickname || nicknameInput || "닉네임 없음"}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <img src={providerLogos[profile.provider]} alt={profile.provider} className="providerLogo" />
                  <p className="emailText">{email}</p>
                </div>
              </div>
            </div>

            <div className="bodyProfileView">
              <div>나이
                <div>{profile.age}세</div>
              </div>
              <div>키
                <div>{profile.height}cm</div>
              </div>
              <div>몸무게
                <div>{profile.weight}kg</div>
              </div>
              <div>성별
                <div>{profile.gender === "MALE" ? "남성" : "여성"}</div>
              </div>
              <div>활동 레벨
                <div>{profile.activityLevel}</div>
              </div>
            </div>

            <div className="editBtn" style={{ textAlign: "right" }}>
              <button onClick={() => setActiveTab("edit")}>편집하기</button>
            </div>
          </div>
        )}

        {activeTab === "edit" && (
          <div className="profileEditContainer">
            <div className="editLayout">
              <div className="leftPanel">
                <div className="nicknameInputContainer">
                  <label className="inlineLabel">
                    <span>닉네임:</span>
                    <input
                      type="text"
                      value={nicknameInput}
                      onChange={(e) => {
                        setNicknameInput(e.target.value);
                        setNicknameError(""); // 사용자가 다시 입력하면 에러 문구 초기화
                      }}
                      placeholder="닉네임 입력"
                      className="nicknameInput"
                      style={{ width: "200px" }}
                    />
                  </label>
                  {nicknameError && <div className="warning" style={{ color: "red", marginTop: "2px", fontSize: "14px" }}>{nicknameError}</div>}
                </div>

                <hr style={{ border: "none" }} /> {/* 공백 추가 */}

                <h3>신체 정보</h3>
                <label className="inlineLabel">
                  <span>나이:</span>
                  <input type="number" value={age} onChange={(e) => setAge(e.target.value)} placeholder="예: 25" />
                  <span>세</span>
                </label>
                <label className="inlineLabel">
                  <span>키:</span>
                  <input type="number" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="예: 175" />
                  <span>cm</span>
                </label>
                <p className="hint">※ 키는 100cm 이상, 250cm 이하로 입력해주세요.</p>
                <label className="inlineLabel">
                  <span>몸무게:</span>
                  <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="예: 70" />
                  <span>kg</span>
                </label>
                <label className="inlineLabel">
                  <span>성별:</span>
                  <select value={gender} onChange={(e) => setGender(e.target.value)} style={{ width: "100px" }}>
                    <option value="male">남성</option>
                    <option value="female">여성</option>
                  </select>
                </label>

                <div className="activityLevel">
                  <p>활동 레벨:</p>
                  {["1. 사무실에서 일만 (운동 거의 없음)", "2. 조금 활동적 (주 2회 가벼운 운동)", "3. 중간 강도의 운동 (주 3~5일)", "4. 고강도 운동 (주 6~7일)"].map(
                    (text, idx) => {
                      const lvl = idx + 1;
                      return (
                        <button key={lvl} className={activityLevel === lvl ? "active" : ""} onClick={() => setActivityLevel(lvl)}>
                          {text}
                        </button>
                      );
                    }
                  )}
                </div>
              </div>

              <div className="rightPanel">
                <h3>프로필 사진</h3>
                <div className="profileImageEdit">
                  <img src={tempProfileImage || DEFAULT_IMAGE} alt="profile" className="profileImage" />
                  <input type="file" ref={fileInputRef} onChange={handleImageChange} style={{ display: "none" }} accept="image/*" />
                  <button className="changeImageBtn" onClick={handleImageUpload}>
                    사진 변경
                  </button>
                </div>
              </div>
            </div>

            <div className="editActions">
              <button onClick={handleSaveAllProfiles}>저장</button>
              <button onClick={handleCancelEdit}>취소</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
