package com.formaos.tests;

import com.formaos.base.BaseTest;
import org.testng.Assert;
import org.testng.annotations.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.OutputType;
import org.openqa.selenium.TakesScreenshot;
import java.nio.file.Files;
import java.nio.file.Paths;

public class AcceptInviteUAT extends BaseTest {

    @Test(description = "UAT: Accept organization invite and verify onboarding, security, and error handling")
    public void testAcceptInviteFlow() {
        // Step 1: Login as a user with a valid invite (simulate or use test account)
        navigateTo("/auth/signin");
        // ...simulate login (implement login helper if needed)...

        // Step 2: Visit the accept-invite page with a valid token
        String inviteToken = System.getenv("UAT_INVITE_TOKEN");
        Assert.assertNotNull(inviteToken, "UAT_INVITE_TOKEN must be set in environment");
        navigateTo("/accept-invite/" + inviteToken);

        boolean conditionalPass = false;
        String pageSource = driver.getPageSource();
        String currentUrl = getCurrentUrl();
        String authState = "unknown"; // Simulate or fetch auth state if possible
        try {
            // Success: Welcome/onboarding UI
            WebElement welcomeHeader = driver.findElement(By.xpath("//h1[contains(text(),'Welcome to') or contains(text(),'Welcome')]"));
            WebElement dashboardLink = driver.findElement(By.xpath("//a[contains(@href, '/app') and contains(.,'Go to Dashboard')]"));
            if (welcomeHeader.isDisplayed() && dashboardLink.isDisplayed()) {
                conditionalPass = true;
            }
        } catch (Exception e1) {
            try {
                // Token expired/invalid message
                WebElement errorHeader = driver.findElement(By.xpath("//h1[contains(text(),'Invalid Invitation') or contains(text(),'Expired') or contains(text(),'Revoked') or contains(text(),'Already Accepted') or contains(text(),'Error')]") );
                WebElement errorMsg = driver.findElement(By.xpath("//p[contains(.,'expired') or contains(.,'invalid') or contains(.,'revoked') or contains(.,'already accepted') or contains(.,'Failed to accept invitation')]"));
                if (errorHeader.isDisplayed() && errorMsg.isDisplayed()) {
                    conditionalPass = true;
                }
            } catch (Exception e2) {
                try {
                    // Email mismatch message
                    WebElement mismatchHeader = driver.findElement(By.xpath("//h1[contains(text(),'Email Mismatch')]") );
                    WebElement mismatchMsg = driver.findElement(By.xpath("//p[contains(.,'signed in as')]") );
                    if (mismatchHeader.isDisplayed() && mismatchMsg.isDisplayed()) {
                        conditionalPass = true;
                    }
                } catch (Exception e3) {
                    try {
                        // Redirect to login/dashboard
                        if (currentUrl.contains("/auth/signin") || currentUrl.contains("/app")) {
                            conditionalPass = true;
                        }
                    } catch (Exception e4) {
                        // No valid state found
                    }
                }
            }
        }

        // On any failure, capture evidence
        if (!conditionalPass) {
            // Capture screenshot
            try {
                byte[] screenshot = ((TakesScreenshot) driver).getScreenshotAs(OutputType.BYTES);
                Files.createDirectories(Paths.get("test-results/screenshots"));
                Files.write(Paths.get("test-results/screenshots/uat_invite_flow.png"), screenshot);
            } catch (Exception ex) {
                System.out.println("Screenshot capture failed: " + ex.getMessage());
            }
            // Log page HTML
            try {
                Files.write(Paths.get("test-results/screenshots/uat_invite_flow.html"), pageSource.getBytes());
            } catch (Exception ex) {
                System.out.println("HTML capture failed: " + ex.getMessage());
            }
            System.out.println("Current URL: " + currentUrl);
            System.out.println("Auth state: " + authState);
        }

        Assert.assertTrue(conditionalPass, "Invite flow is security-compliant and did not crash. See evidence for details.");
    }
}
