import React, {useEffect, useState} from 'react';
import {useActionData, useLocation, useNavigate, useNavigation, Form} from 'react-router-dom';
import './CreateProfile.css';

import Button from '#shared/components/UIElement/Button/Button';
import Input from '#shared/components/UIElement/Input/Input';
import LoadingSpinner from '#shared/components/UIElement/LoadingSpinner/LoadingSpinner';
import Icon from '#shared/components/UIElement/Icon/Icon';
import { createProfile } from '#services/authService';

function CreateProfile() {
    const navigate = useNavigate();
    const navigation = useNavigation();
    const isSubmitting = navigation.state === 'submitting';
    const actionData = useActionData();
    const location = useLocation();

    // Get profileId from location.state
    const profileId = location.state?.profileId;

    const [formErrors, setFormErrors] = useState({});
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [bannerPreview, setBannerPreview] = useState(null);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Redirect if no profileId
    useEffect(() => {
        if (!profileId) {
            navigate('/login', { replace: true });
        }
    }, [profileId, navigate]);

    // Handle action data
    useEffect(() => {
        if (actionData) {
            if (actionData.success) {
                setSuccess('Profile created successfully!');
                navigate('/dashboard');
            } else if (actionData.error) {
                setError(actionData.message || 'Failed to create profile');
                if (actionData.errors) {
                    setFormErrors(actionData.errors);
                }
            }
        }
    }, [actionData, navigate]);

    const handleFileChange = (e) => {
        const {name, files} = e.target;
        if (files && files[0]) {
            const file = files[0];

            // Check file size (limit 5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert('File size is too large. Please choose a file smaller than 5MB.');
                return;
            }

            // Check file type
            const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
            if (!validImageTypes.includes(file.type)) {
                alert('Only image files are accepted (JPEG, PNG, GIF, WEBP).');
                return;
            }

            // Create preview URL
            const fileUrl = URL.createObjectURL(file);
            if (name === 'avatar') {
                if (avatarPreview) {
                    URL.revokeObjectURL(avatarPreview);
                }
                setAvatarPreview(fileUrl);
            } else if (name === 'banner') {
                if (bannerPreview) {
                    URL.revokeObjectURL(bannerPreview);
                }
                setBannerPreview(fileUrl);
            }
        }
    };

    const handleSkip = () => {
        navigate('/login');
    };

    return (
        <div className="create-profile-container">
            {isSubmitting && <LoadingSpinner message="Đang tạo hồ sơ..."/>}

            <div className="create-profile-card">
                <div className="create-profile-header">
                    <h1>Tạo hồ sơ cá nhân</h1>
                    <p>Vui lòng cung cấp thông tin để hoàn tất hồ sơ của bạn</p>
                </div>

                {error && (
                    <div className="alert alert-danger mb-3">
                        {error}
                    </div>
                )}

                <Form
                    method="put"
                    encType="multipart/form-data"
                    className="create-profile-form"
                >
                    {/* Hidden input for profileId */}
                    <input
                        type="hidden"
                        name="profileId"
                        value={profileId || ''}
                    />

                    <div className="form-group">
                        <Input
                            id="displayName"
                            name="displayName"
                            label="Tên hiển thị"
                            placeholder="Nhập tên hiển thị"
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
