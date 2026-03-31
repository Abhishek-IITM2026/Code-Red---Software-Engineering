from pydantic import Field

from .validation import StrictModel


class LoginRequest(StrictModel):
    email: str
    password: str


class RegisterRequest(StrictModel):
    email: str
    password: str
    first_name: str = Field(alias="firstName")
    last_name: str = Field(alias="lastName")
    role: str = "student"
    title: str | None = None


class OtpSendRequest(StrictModel):
    email: str
    purpose: str


class OtpVerifyRequest(StrictModel):
    email: str
    purpose: str
    otp: str


class ProfileUpdateRequest(StrictModel):
    first_name: str | None = Field(default=None, alias="firstName")
    last_name: str | None = Field(default=None, alias="lastName")
    phone: str | None = None


class ProfilePictureUpdateRequest(StrictModel):
    profile_picture: str | None = Field(default=None, alias="profilePicture")


class ChangePasswordRequest(StrictModel):
    current_password: str = Field(alias="currentPassword")
    new_password: str = Field(alias="newPassword")
    confirm_password: str = Field(alias="confirmPassword")
