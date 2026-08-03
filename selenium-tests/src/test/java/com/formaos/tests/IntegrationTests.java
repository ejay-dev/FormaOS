package com.formaos.tests;

import com.formaos.base.BaseTest;
import com.formaos.pages.HomePage;
import org.testng.Assert;
import org.testng.annotations.Test;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

/**
 * Audit 2026-08-02: five of the six tests in this class were
 * `Assert.assertTrue(true, "...placeholder")`. TestNG counted them as
 * passes, so the suite output advertised coverage for RLS enforcement on
 * API routes, role-based permissions, billing/plan integration and
 * subscription feature gating while issuing no request at all.
 *
 * BaseTest provides no sign-in helper, so this harness can only observe the
 * unauthenticated surface. The two placeholders that genuinely required an
 * authenticated session with a manipulated subscription
 * (testTrialActivationDashboardAccess, testFeatureGatingBySubscription)
 * were removed rather than left as green no-ops; that behaviour is covered
 * for real in e2e/trial-provisioning-guarantee.spec.ts, which drives the
 * /app billing gate and the entitlement resolver end to end.
 *
 * The remaining checks assert the half of each contract this harness can
 * actually execute — that org-scoped surfaces refuse anonymous callers —
 * and fail if any of them starts answering 200.
 */
public class IntegrationTests extends BaseTest {

    private static final HttpClient HTTP = HttpClient.newBuilder()
        .followRedirects(HttpClient.Redirect.NEVER)
        .connectTimeout(Duration.ofSeconds(15))
        .build();

    private HttpResponse<String> getAnonymous(String path) throws Exception {
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(baseUrl + path))
            .timeout(Duration.ofSeconds(20))
            .header("Accept", "application/json")
            .GET()
            .build();
        return HTTP.send(request, HttpResponse.BodyHandlers.ofString());
    }

    @Test(description = "Verify Supabase auth integration with frontend")
    public void testSupabaseAuthFrontend() {
        navigateToHome();
        HomePage homePage = new HomePage(driver);
        homePage.clickStartFreeTrial();
        waitForPageLoad();
        Assert.assertTrue(getCurrentUrl().contains("/auth/signup"), "Should navigate to signup page");
        // Additional checks for signup form presence can be added here
    }

    @Test(description = "Verify org-scoped API routes reject anonymous callers")
    public void testRLSApiEnforcement() throws Exception {
        String[] orgScopedRoutes = {
            "/api/v1/evidence",
            "/api/v1/tasks",
            "/api/v1/members",
            "/api/onboarding-state",
        };

        for (String route : orgScopedRoutes) {
            HttpResponse<String> response = getAnonymous(route);
            int status = response.statusCode();

            Assert.assertTrue(status != 200,
                "SECURITY: " + route + " answered 200 to an anonymous caller");
            Assert.assertTrue(status == 401 || status == 403,
                "Expected 401/403 from " + route + " for an anonymous caller but got " + status);

            String body = response.body() == null ? "" : response.body();
            Assert.assertFalse(body.contains("organization_id"),
                "SECURITY: " + route + " leaked organization data to an anonymous caller");
        }
    }

    @Test(description = "Verify authenticated app surfaces are not reachable without a session")
    public void testRoleBasedUIPermissions() {
        String[] privatePaths = { "/app", "/app/team", "/app/settings", "/admin" };

        for (String path : privatePaths) {
            navigateTo(path);
            waitForPageLoad();

            String currentUrl = getCurrentUrl();
            Assert.assertFalse(
                currentUrl.endsWith(path) || currentUrl.contains(path + "?"),
                "SECURITY: " + path + " rendered for an anonymous visitor at " + currentUrl);
            Assert.assertTrue(
                currentUrl.contains("/auth/signin") || currentUrl.contains("/unauthorized"),
                "Anonymous visit to " + path + " should land on sign-in or /unauthorized but landed on " + currentUrl);
        }
    }

    @Test(description = "Verify billing/plan endpoints require an authenticated org context")
    public void testBillingPlanSchemaIntegration() throws Exception {
        HttpResponse<String> billing = getAnonymous("/api/billing");
        Assert.assertEquals(billing.statusCode(), 401,
            "SECURITY: /api/billing must reject anonymous callers but returned " + billing.statusCode());

        String body = billing.body() == null ? "" : billing.body();
        Assert.assertFalse(body.contains("plan_key") || body.contains("stripe"),
            "SECURITY: /api/billing leaked subscription detail to an anonymous caller");
    }
}
