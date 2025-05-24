import React, {useEffect, useState} from 'react';
import {useActionData, useLocation, useNavigate, useNavigation} from 'react-router';
import './CreateProfile.css';

import Button from '#shared/components/UIElement/Button/Button';
import Input from '#shared/components/UIElement/Input/Input';
import Form from '#shared/components/UIElement/Form/Form';
import LoadingSpinner from '#shared/components/UIElement/LoadingSpinner/LoadingSpinner';
import Icon from '#shared/components/UIElement/Icon/Icon';
import { createProfile } from '#services/authService';

function CreateProfile() {
    const navigate = useNavigate();
    const navigation = useNavigation();
    const isSubmitting = navigation.state === 'submitting';
    const actionData = useActionData();
    const location = useLocation(); //lấy profileId từ đây 

    // Lấy profileId từ location.state
    const profileId = location.state?.profileId;

    // Thêm console.log để hiển thị profileId
    // console.log('CreateProfile - profileId:', profileId);
    // console.log('CreateProfile - location.state:', location.state);

    const [formData, setFormData] = useState({})
    const [formErrors, setFormErrors] = useState({});
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [bannerPreview, setBannerPreview] = useState(null);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Add effect to update formData with profileId
    useEffect(() => {
        if (profileId) {
            setFormData(prev => ({
                ...prev,
                profileId: profileId
            }));
        }
    }, [profileId]);

    const handleChange = (e) => {
        const {name, value} = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Xóa lỗi khi người dùng thay đổi giá trị
        if (formErrors[name]) {
            setFormErrors(prev => ({
                ...prev,
                [name]: null
            }));
        }
    };

    const handleFileChange = (e) => {
        const {name, files} = e.target;
        if (files && files[0]) {
            const file = files[0];

            // Kiểm tra kích thước file (giới hạn 5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert('Kích thước file quá lớn. Vui lòng chọn file nhỏ hơn 5MB.');
                return;
            }

            // Kiểm tra loại file
            const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
            if (!validImageTypes.includes(file.type)) {
                alert('Chỉ chấp nhận file hình ảnh (JPEG, PNG, GIF, WEBP).');
                return;
            }

            setFormData(prev => ({
                ...prev,
                [name]: file
            }));

            // Tạo URL preview cho file
            const fileUrl = URL.createObjectURL(file);
            if (name === 'avatar') {
                // Hủy URL cũ nếu có
                if (avatarPreview) {
                    URL.revokeObjectURL(avatarPreview);
                }
                setAvatarPreview(fileUrl);
            } else if (name === 'banner') {
                // Hủy URL cũ nếu có
                if (bannerPreview) {
                    URL.revokeObjectURL(bannerPreview);
                }
                setBannerPreview(fileUrl);
            }
        }
    };

    const validateForm = () => {
        const errors = {};
        if (!formData.displayName.trim()) {
            errors.displayName = 'Vui lòng nhập tên hiển thị';
        }

        // Thêm validation cho gender nếu bạn muốn nó là bắt buộc
        if (!formData.gender) {
            errors.gender = 'Vui lòng chọn giới tính';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSkip = () => {
        // Chuyển hướng trực tiếp đến trang đăng nhập
        navigate('/login');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormErrors({});
        setError(null);
        setSuccess(null);
        setIsSubmitting(true);

        // Log the current state
        console.log('Submitting form with profileId:', profileId);
        console.log('Current formData:', formData);

        try {
            // Create FormData object from formData state
            const submitData = new FormData();
            Object.entries(formData).forEach(([key, value]) => {
                if (value !== null && value !== undefined) {
                    submitData.append(key, value);
                }
            });

            // Add files if they exist
            if (formData.avatar instanceof File) {
                submitData.append('avatar', formData.avatar);
            }
            if (formData.banner instanceof File) {
                submitData.append('banner', formData.banner);
            }

            // Log the FormData contents
            console.log('FormData contents:');
            for (let [key, value] of submitData.entries()) {
                console.log(`${key}:`, value);
            }

            const response = await createProfile(submitData);
            console.log('Profile creation response:', response);
            setSuccess('Profile created successfully!');
            navigate('/dashboard');
        } catch (err) {
            console.error('Profile creation error:', err);
            setError(err.message || 'Failed to create profile');
            if (err.errors) {
                setFormErrors(err.errors);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    useEffect(() => {
        // // Thêm console.log trong useEffect để xem profileId khi component mount và khi nó thay đổi
        // console.log('CreateProfile useEffect - profileId:', profileId);
        // console.log('CreateProfile useEffect - location.state:', location.state);

        // Redirect to create-profile page if verification is successful
        if (actionData && actionData.success) {
            navigate('/login');
        }
        if (actionData && actionData.error) {
            console.error(actionData.error);
        }
    }, [actionData, navigate]);

    return (
        <div className="create-profile-container">
            {isSubmitting && <LoadingSpinner message="Đang tạo hồ sơ..."/>}


            {/* <div className="test-profile-id" style={{
          position: 'fixed', 
          top: '10px', 
          right: '10px', 
          background: '#f0f0f0', 
          padding: '5px 10px', 
          borderRadius: '5px',
          border: '1px solid #ccc',
          fontSize: '12px',
          zIndex: 1000
        }}>
          ProfileID: {profileId || 'Không có'}
        </div> */}

            <div className="create-profile-card">
                <div className="create-profile-header">
                    <h1>Tạo hồ sơ cá nhân</h1>
                    <p>Vui lòng cung cấp thông tin để hoàn tất hồ sơ của bạn</p>
                </div>

                <Form
                    id="create-profile"
                    onSubmit={handleSubmit}
                    mainClass="create-profile-form"
                    encType="multipart/form-data"
                >
                    {/* Hidden input for profileId */}
                    <input
                        type="hidden"
                        name="profileId"
                        value={profileId || ''}
                        onChange={handleChange}
                    />

                    <div className="form-group">
                        <Input
                            id="displayName"
                            name="displayName"
                            label="Tên hiển thị"
                            placeholder="Nhập tên hiển thị"
                            value={formData.displayName}
                            onChange={handleChange}
                            isInvalid={!!formErrors.displayName}
                            feedback={formErrors.displayName}
                            addon={<Icon name="user" size="16"/>}
                            required
                            disabled={isSubmitting}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="bio" className="form-label">Giới thiệu</label>
                        <textarea
                            id="bio"
                            name="bio"
                            className={`form-control ${formErrors.bio ? 'is-invalid' : ''}`}
                            placeholder="Giới thiệu ngắn về bạn"
                            value={formData.bio}
                            onChange={handleChange}
                            rows="3"
                            disabled={isSubmitting}
                            required
                        ></textarea>
                        {formErrors.bio && <div className="invalid-feedback">{formErrors.bio}</div>}
                    </div>

                    <div className="form-group">
                        <Input
                            id="location"
                            name="location"
                            label="Vị trí"
                            placeholder="Nhập vị trí của bạn"
                            value={formData.location}
                            onChange={handleChange}
                            isInvalid={!!formErrors.location}
                            feedback={formErrors.location}
                            addon={<Icon name="location" size="16"/>}
                            disabled={isSubmitting}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="gender" className="form-label">Giới tính</label>
                        <select
                            id="gender"
                            name="gender"
                            className={`form-control ${formErrors.gender ? 'is-invalid' : ''}`}
                            value={formData.gender}
                            onChange={handleChange}
                            disabled={isSubmitting}
                            required
                        >
                            <option value="">-- Chọn giới tính --</option>
                            <option value="male">Nam</option>
                            <option value="female">Nữ</option>
                            <option value="non_binary">Phi nhị phân</option>
                            <option value="other">Khác</option>
                            <option value="prefer_not_to_say">Không muốn tiết lộ</option>
                        </select>
                        {formErrors.gender && <div className="invalid-feedback">{formErrors.gender}</div>}
                    </div>


                    <div className="media-section">
                        <h3>Ảnh đại diện và ảnh bìa</h3>

                        <div className="media-item">
                            <h4>Ảnh đại diện</h4>
                            <div className="file-input-container">
                                <input
                                    type="file"
                                    id="avatar"
                                    name="avatar"
                                    className="file-input"
                                    onChange={handleFileChange}
                                    accept="image/*"
                                    disabled={isSubmitting}
                                />
                                <label htmlFor="avatar" className="file-input-label">
                                    Chọn ảnh đại diện
                                </label>

                                {avatarPreview ? (
                                    <div className="image-preview">
                                        <img src={avatarPreview} alt="Avatar preview" className="avatar-preview"/>
                                    </div>
                                ) : (
                                    <div className="preview-placeholder">
                                        Chưa có ảnh đại diện
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="media-item">
                            <h4>Ảnh bìa</h4>
                            <div className="file-input-container">
                                <input
                                    type="file"
                                    id="banner"
                                    name="banner"
                                    className="file-input"
                                    onChange={handleFileChange}
                                    accept="image/*"
                                    disabled={isSubmitting}
                                />
                                <label htmlFor="banner" className="file-input-label">
                                    Chọn ảnh bìa
                                </label>

                                {bannerPreview ? (
                                    <div className="image-preview">
                                        <img src={bannerPreview} alt="Banner preview" className="banner-preview"/>
                                    </div>
                                ) : (
                                    <div className="preview-placeholder">
                                        Chưa có ảnh bìa
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="button-container">
                        <Button
                            type="button"
                            mainClass="skip-button"
                            onClick={handleSkip}
                            disabled={isSubmitting}
                        >
                            Bỏ qua
                        </Button>
                        <Button
                            type="submit"
                            mainClass="submit-button"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Đang xử lý...' : 'Hoàn tất hồ sơ'}
                        </Button>
                    </div>
                </Form>
            </div>
        </div>
    );
}

export default CreateProfile;
