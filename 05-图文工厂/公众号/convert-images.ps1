$imgDir = "img-2026-03-08-从用户痛点到蓝海市场-AI驱动的创业新思路"
$images = @("p1-cover.png","p2-painpoint.png","p3-ai-revolution.png","p4-framework.png","p5-case.png","p6-cta.png")
foreach ($img in $images) {
    $b64 = [Convert]::ToBase64String([System.IO.File]::ReadAllBytes("$imgDir/$img"))
    $b64 | Out-File -FilePath "$img.b64" -Encoding utf8
}
Write-Output "Done"
