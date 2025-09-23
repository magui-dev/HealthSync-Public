import { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./ProfilePage.css";

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState("view");
  const [profile, setProfile] = useState(null);
  const [nicknameInput, setNicknameInput] = useState("");
  const [email, setEmail] = useState("");
  const [age, setAge] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [gender, setGender] = useState("male");
  const [activityLevel, setActivityLevel] = useState(null);

  // 프로필 사진 편집 관련 상태
  const [tempProfileImage, setTempProfileImage] = useState(null); // 미리보기용 임시 이미지 URL
  const fileInputRef = useRef(null);

  // --- 프로필 정보 불러오기 ---
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const bodyProfileRes = await axios.get("http://localhost:8080/profile", { withCredentials: true });
        const accountProfileRes = await axios.get("http://localhost:8080/api/auth/me", { withCredentials: true });

        const combinedProfile = {
          ...bodyProfileRes.data,
          ...accountProfileRes.data,
        };

        setProfile(combinedProfile);
        setAge(combinedProfile.age ?? "");
        setHeight(combinedProfile.height ?? "");
        setWeight(combinedProfile.weight ?? "");
        setGender(combinedProfile.gender?.toLowerCase() ?? "male");
        setActivityLevel(combinedProfile.activityLevel ?? null);
        setEmail(combinedProfile.email || "");
        setNicknameInput(combinedProfile.nickname || "");
        setTempProfileImage(combinedProfile.picture || null); // 초기 이미지 설정
      } catch (err) {
        console.error(err);
        alert("프로필 정보를 불러오지 못했습니다.");
      }
    };
    fetchProfileData();
  }, []);

  // --- 프로필 사진 미리보기 ---
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setTempProfileImage(URL.createObjectURL(file)); // 미리보기 URL 생성
    }
  };

  const handleImageUpload = () => {
    fileInputRef.current.click();
  };

  const handleImageDelete = () => {
    setTempProfileImage(null); // 이미지 삭제
  };

  // --- 프로필 전체 저장 ---
  const handleSaveAllProfiles = async () => {
    if (height < 100 || height > 250) {
      alert("키는 100cm 이상, 250cm 이하로 입력해주세요.");
      return;
    }
    if (!activityLevel) {
      alert("활동 레벨을 선택해주세요.");
      return;
    }
    if (!nicknameInput) {
      alert("닉네임을 입력해주세요.");
      return;
    }

    try {
      // 프로필 사진 업데이트 로직
      if (fileInputRef.current.files[0]) {
        // 새 이미지가 선택된 경우
        const formData = new FormData();
        formData.append("profileImage", fileInputRef.current.files[0]);
        await axios.post("http://localhost:8080/api/auth/profile-image", formData, { withCredentials: true, headers: { "Content-Type": "multipart/form-data" } });
      } else if (profile.picture && tempProfileImage === null) {
        // 기존 이미지가 있고, 삭제 버튼을 누른 경우
        await axios.delete("http://localhost:8080/api/auth/profile-image", { withCredentials: true });
      }

      // 닉네임과 신체 정보 저장
      await axios.patch("http://localhost:8080/api/auth/nickname", { nickname: nicknameInput }, { withCredentials: true });
      await axios.put("http://localhost:8080/profile/edit", { age: Number(age), height: Number(height), weight: Number(weight), gender: gender.toUpperCase(), activityLevel }, { withCredentials: true });
      
      // BMI 계산
      await axios.post("http://localhost:8080/calc/bmi", null, { params: { userId: profile.userId }, withCredentials: true });

      alert("프로필이 성공적으로 저장되었습니다.");

      // 최종 상태 업데이트
      const updatedProfile = {
        ...profile,
        age,
        height,
        weight,
        gender: gender.toUpperCase(),
        activityLevel,
        nickname: nicknameInput,
        picture: tempProfileImage || "./public/profile-images/default-profile.jpg",
      };
      setProfile(updatedProfile);
      setTempProfileImage(updatedProfile.picture);
      setActiveTab("view");
    } catch (err) {
      console.error(err);
      alert("프로필 저장 중 오류가 발생했습니다.");
    }
  };

  if (!profile) return <p>로딩 중...</p>;

  return (
    <div className="profilePage">
      <aside className="sidebar">
        <div className={activeTab === "view" ? "active" : ""} onClick={() => setActiveTab("view")}>프로필 설정</div>
      </aside>
      <main className="mainContent">
        <h2>프로필 설정</h2>
        {activeTab === "view" && (
          <div className="profileContainer">
            <div className="profileHeader">
              <img src={profile.picture || "./public/profile-images/default-profile.jpg"} alt="profile" className="profileImage" />
              <div>
                <p className="nicknameText">{profile.nickname || nicknameInput || "닉네임 없음"}</p>
                <p className="emailText">{email} ({profile.login})</p>
              </div>
            </div>
            <div className="bodyProfileView">
              <p>나이: {profile.age} 세</p>
              <p>키: {profile.height} cm</p>
              <p>몸무게: {profile.weight} kg</p>
              <p>성별: {profile.gender === "MALE" ? "남성" : "여성"}</p>
              <p>활동 레벨: {profile.activityLevel}</p>
            </div>
            <div className="editBtn">
              <button onClick={() => setActiveTab("edit")}>편집하기</button>
            </div>
          </div>
        )}
        {activeTab === "edit" && (
          <div className="profileEditContainer">
            <div className="editLayout">
              {/* 왼쪽 열 */}
              <div className="leftPanel">
                {/* 닉네임 편집 */}
                <div className="nicknameInputContainer">
                  <label className="inlineLabel">
                    <span>닉네임:</span>
                    <input type="text" value={nicknameInput} onChange={(e) => setNicknameInput(e.target.value)} placeholder="닉네임 입력" className="nicknameInput" style={{ width: '200px' }} />
                  </label>
                </div>
                <hr style={{ borderColor: '#ddd', borderWidth: '1px', borderStyle: 'solid' }} />
                {/* 신체 정보 편집 */}
                <h3>신체 정보</h3>
                <label className="inlineLabel"><span>나이:</span><input type="number" value={age} onChange={(e) => setAge(e.target.value)} placeholder="예: 25" /><span>세</span></label>
                <label className="inlineLabel"><span>키:</span><input type="number" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="예: 175" /><span>cm</span></label>
                <p className="hint">※ 키는 100cm 이상, 250cm 이하로 입력해주세요.</p>
                <label className="inlineLabel"><span>몸무게:</span><input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="예: 70" /><span>kg</span></label>
                <label className="inlineLabel"><span>성별:</span>
                  <select value={gender} onChange={(e) => setGender(e.target.value)} style={{ width: '100px' }}>
                    <option value="male">남성</option>
                    <option value="female">여성</option>
                  </select>
                </label>
                <div className="activityLevel">
                  <p>활동 레벨:</p>
                  {[ "1. 사무실에서 일만 (운동 거의 없음)", "2. 조금 활동적 (주 2회 가벼운 운동)", "3. 중간 강도의 운동 (주 3~5일)", "4. 고강도 운동 (주 6~7일)" ].map((text, idx) => {
                    const lvl = idx + 1;
                    return (<button key={lvl} className={activityLevel === lvl ? "active" : ""} onClick={() => setActivityLevel(lvl)}>{text}</button>);
                  })}
                </div>
              </div>
              {/* 오른쪽 열 */}
              <div className="rightPanel">
                <h3>프로필 사진</h3>
                <div className="profileImageEdit">
                  <img src={tempProfileImage || "./public/images/profile-images/default-profile1.png"} alt="profile" className="profileImage" />
                  <input type="file" ref={fileInputRef} onChange={handleImageChange} style={{ display: 'none' }} accept="image/*" />
                  <button className="changeImageBtn" onClick={handleImageUpload}>사진 변경</button>
                  <button className="removeImageBtn" onClick={handleImageDelete}>삭제</button>
                </div>
              </div>
            </div>
            <div className="editActions">
              <button onClick={handleSaveAllProfiles}>저장</button>
              <button onClick={() => {
                setTempProfileImage(profile.picture); // 취소 시 원래 이미지로 복원
                setActiveTab("view");
              }}>취소</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}