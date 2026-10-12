namespace QLVB.Domain.Enums;

/// <summary>
/// Loại văn bản
/// </summary>
public enum DocumentType
{
    /// <summary>
    /// Công văn chỉ đạo
    /// </summary>
    Directive = 1,
    
    /// <summary>
    /// Báo cáo
    /// </summary>
    Report = 2,
    
    /// <summary>
    /// Quyết định
    /// </summary>
    Decision = 3,
    
    /// <summary>
    /// Thông báo
    /// </summary>
    Notification = 4,

    /// <summary>
    /// Quy trình
    /// </summary>
    Procedure = 5,

    /// <summary>
    /// Biên bản
    /// </summary>
    Minutes = 6,

    /// <summary>
    /// Kế hoạch
    /// </summary>
    Plan = 7,

    /// <summary>
    /// Tờ trình
    /// </summary>
    Proposal = 8,

    /// <summary>
    /// Giấy ủy quyền
    /// </summary>
    Authorization = 9,

    /// <summary>
    /// Giấy giới thiệu
    /// </summary>
    IntroductionLetter = 10,

    /// <summary>
    /// Hợp đồng
    /// </summary>
    Contract = 11,

    /// <summary>
    /// GXN công tác/hành nghề
    /// </summary>
    WorkCertificate = 12,

    /// <summary>
    /// Hồ sơ HCNS
    /// </summary>
    AdminRecord = 13,
    
    /// <summary>
    /// Loại khác
    /// </summary>
    Other = 99
}

public static class DocumentTypeExtensions
{
    public static string GetAbbreviation(this DocumentType type)
    {
        return type switch
        {
            DocumentType.Directive => "CV",
            DocumentType.Report => "BC",
            DocumentType.Decision => "QĐ",
            DocumentType.Notification => "TB",
            DocumentType.Procedure => "QT",
            DocumentType.Minutes => "BB",
            DocumentType.Plan => "KH",
            DocumentType.Proposal => "TT",
            DocumentType.Authorization => "UQ",
            DocumentType.IntroductionLetter => "GGT",
            DocumentType.Contract => "HĐ",
            DocumentType.WorkCertificate => "GXN",
            DocumentType.AdminRecord => "HC",
            DocumentType.Other => "K",
            _ => "K"
        };
    }
}
