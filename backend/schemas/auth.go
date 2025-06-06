package schemas

type RegisterRequest struct {
	Username       string `json:"username" binding:"required"`
	MasterPassword string `json:"master_password" binding:"required"`
}

type LoginRequest struct {
	Username       string `json:"username" binding:"required"`
	MasterPassword string `json:"master_password" binding:"required"`
}

type LoginResponse struct {
	Token        string `json:"token"`
	UserID       uint   `json:"user_id"`
	Username     string `json:"username"`
	TwoFAEnabled bool   `json:"two_fa_enabled"`
	Salt         string `json:"salt"`
}

type TwoFactorSetupRequest struct {
	Code string `json:"code" binding:"required"`
}

type TwoFactorVerifyRequest struct {
	Username string `json:"username" binding:"required"`
	Code     string `json:"code" binding:"required"`
}
