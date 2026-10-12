using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QLVB.Application.DTOs.Auth;
using QLVB.Application.Services;
using System.Security.Claims;

namespace QLVB.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<LoginResponseDto>> Login([FromBody] LoginRequestDto request)
    {
        try
        {
            var result = await _authService.LoginAsync(request);

            if (result == null)
                return Unauthorized(new { message = "Tên đăng nhập hoặc mật khẩu không đúng" });

            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<UserDto>> GetCurrentUser()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            return Unauthorized();

        var user = await _authService.GetCurrentUserAsync(userId);

        if (user == null)
            return NotFound();

        return Ok(user);
    }

    [HttpPost("refresh-token")]
    [Authorize]
    public async Task<ActionResult<LoginResponseDto>> RefreshToken()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            return Unauthorized();

        var result = await _authService.RefreshTokenAsync(userId);

        if (result == null)
            return Unauthorized(new { message = "Không thể làm mới token" });

        return Ok(result);
    }

    [HttpPost("forgot-password")]
    [AllowAnonymous]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequestDto request)
    {
        try
        {
            var result = await _authService.SendPasswordResetCodeAsync(request.Email);

            if (!result)
                return BadRequest(new { message = "Không tìm thấy người dùng với email này hoặc tài khoản đã bị khóa" });

            return Ok(new { message = "Mã xác nhận đã được gửi đến email của bạn" });
        }
        catch (Exception)
        {
            return StatusCode(500, new { message = "Có lỗi xảy ra khi gửi email. Vui lòng thử lại sau." });
        }
    }

    [HttpPost("verify-reset-code")]
    [AllowAnonymous]
    public async Task<IActionResult> VerifyResetCode([FromBody] VerifyResetCodeDto request)
    {
        var result = await _authService.VerifyResetCodeAsync(request.Email, request.ResetCode);

        if (!result)
            return BadRequest(new { message = "Mã xác nhận không hợp lệ hoặc đã hết hạn" });

        return Ok(new { message = "Mã xác nhận hợp lệ" });
    }

    [HttpPost("reset-password")]
    [AllowAnonymous]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto request)
    {
        if (request.NewPassword.Length < 6)
            return BadRequest(new { message = "Mật khẩu mới phải có ít nhất 6 ký tự" });

        var result = await _authService.ResetPasswordAsync(request.Email, request.ResetCode, request.NewPassword);

        if (!result)
            return BadRequest(new { message = "Mã xác nhận không hợp lệ hoặc đã hết hạn" });

        return Ok(new { message = "Đặt lại mật khẩu thành công" });
    }
}
