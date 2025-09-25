import "./ProfileImageEdit.css";
import CloseButton from "../common/CloseButton";

export default function ProfileImageEdit({ onClose, onSelect }) {

    const ImageUrlPath = "/images/profile-images/";
    const images = [
        "default.png", "default1.png", "default2.png", "default3.png",
        "default4.png", "default5.png", "default6.png"
    ];
    
    return (
        <div className="modalOverlay">
            <div className="modalContent">
                <div className="ModalHeader">
                    <h3>프로필 이미지 선택</h3>
                    <CloseButton onClick={onClose}/>
                </div>

                <div className="selectImageView">
                    {images.map((img) => (
                        <button
                            key={img}
                            onClick={() => {
                                onSelect(`${ImageUrlPath}${img}`);
                                onClose();
                            }}
                        >
                            <img src={`${ImageUrlPath}${img}`} alt={img} />
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}