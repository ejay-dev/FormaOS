package com.formaos.tests;

import com.formaos.base.BaseTest;
import org.testng.Assert;
import org.testng.annotations.Test;
import org.openqa.selenium.OutputType;
import org.openqa.selenium.TakesScreenshot;
import java.nio.file.Files;
import java.nio.file.Paths;

/**
 * UAT for /accept-invite/[token].
 *
 * Audit 2026-08-02: this test used to set a single `conditionalPass` flag if
 * the page showed the accept UI, OR an invalid/expired/revoked error, OR an
 * email-mismatch error, OR the URL was /auth/signin or /app — mutually
 * exclusive outcomes that cannot all be correct for one token. A revoked
 * invite being wrongly ACCEPTED scored as a pass, and so did a valid invite
 * being wrongly rejected. Only an unrecognised page could fail.
 *
 * BaseTest builds a fresh WebDriver per method and provides no sign-in
 * helper, so this driver is always anonymous. The contract that is
 * actually observable — and the one that matters for authorization — is
 * that an anonymous visitor holding a token must NOT be able to accept the
 * invite or read its contents; they must be bounced to sign-in with a
 * return path back to the invite. Assert exactly that.
 */
public class AcceptInviteUAT extends BaseTest {

    private void captureEvidence(String name, String pageSource) {
        try {
            byte[] screenshot = ((TakesScreenshot) driver).getScreenshotAs(OutputType.BYTES);
            Files.createDirectories(Paths.get("test-results/screenshots"));
            Files.write(Paths.get("test-results/screenshots/" + name + ".png"), screenshot);
            Files.write(Paths.get("test-results/screenshots/" + name + ".html"), pageSource.getBytes());
        } catch (Exception ex) {
            System.out.println("Evidence capture failed: " + ex.getMessage());
        }
    }

    @Test(description = "UAT: an anonymous visitor holding an invite token cannot accept it or read it")
    public void testAnonymousVisitorCannotAcceptInvite() {
        String inviteToken = System.getenv("UAT_INVITE_TOKEN");
        Assert.assertNotNull(inviteToken, "UAT_INVITE_TOKEN must be set in environment");
        Assert.assertFalse(inviteToken.isBlank(), "UAT_INVITE_TOKEN must not be blank");

        navigateTo("/accept-invite/" + inviteToken);
        waitForPageLoad();

        String currentUrl = getCurrentUrl();
        String pageSource = driver.getPageSource();
        captureEvidence("uat_invite_anonymous", pageSource);

        System.out.println("Current URL: " + currentUrl);

        // 1. The accept affordance must never render without a session.
        Assert.assertFalse(
            pageSource.contains("Accept Invitation"),
            "SECURITY: the accept-invite form rendered for an anonymous visitor at " + currentUrl);

        // 2. The invite must not be silently accepted (which would land the
        //    visitor on the dashboard or the employee onboarding wizard).
        Assert.assertFalse(
            currentUrl.contains("/app") || currentUrl.contains("/onboarding"),
            "SECURITY: an anonymous invite token was accepted — landed on " + currentUrl);

        // 3. The expected outcome is the sign-in bounce, carrying the invite
        //    as the post-login destination.
        Assert.assertTrue(
            currentUrl.contains("/auth/signin"),
            "Anonymous invite visit should redirect to /auth/signin but landed on " + currentUrl);
        Assert.assertTrue(
            currentUrl.contains("redirect=") && currentUrl.contains("accept-invite"),
            "Sign-in redirect should return the user to the invite; got " + currentUrl);
    }

    @Test(description = "UAT: a garbage invite token is not treated as a valid invite")
    public void testUnknownInviteTokenIsNotAccepted() {
        navigateTo("/accept-invite/definitely-not-a-real-invite-token");
        waitForPageLoad();

        String currentUrl = getCurrentUrl();
        String pageSource = driver.getPageSource();
        captureEvidence("uat_invite_unknown_token", pageSource);

        Assert.assertFalse(
            pageSource.contains("Accept Invitation"),
            "SECURITY: an unknown token rendered the accept-invite form at " + currentUrl);
        Assert.assertFalse(
            currentUrl.contains("/onboarding"),
            "SECURITY: an unknown token was accepted — landed on " + currentUrl);
        Assert.assertTrue(
            currentUrl.contains("/auth/signin"),
            "Anonymous visit with an unknown token should redirect to /auth/signin but landed on " + currentUrl);
    }
}
