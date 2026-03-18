package com.formaos.tests;

import com.formaos.base.BaseTest;
import com.formaos.pages.HomePage;
import org.testng.Assert;
import org.testng.annotations.Test;

public class CTATests extends BaseTest {
    
    @Test(description = "Verify Start Free Trial CTA from homepage")
    public void testStartFreeTrialFromHome() {
        navigateToHome();
        HomePage homePage = new HomePage(driver);
        
        homePage.clickStartFreeTrial();
        waitForPageLoad();
        
        Assert.assertTrue(getCurrentUrl().contains("/auth/signup"), 
            "Start Free Trial should navigate to signup");
        
        System.out.println("✅ Start Free Trial CTA works from homepage");
    }
    
    @Test(description = "Verify Request Demo CTA from homepage")
    public void testRequestDemoFromHome() {
        navigateToHome();
        HomePage homePage = new HomePage(driver);
        
        homePage.clickRequestDemo();
        waitForPageLoad();
        
        Assert.assertTrue(getCurrentUrl().contains("/contact"), 
            "Request Demo should navigate to contact");
        
        System.out.println("✅ Request Demo CTA works from homepage");
    }
    
    @Test(description = "Verify Login CTA from homepage")
    public void testLoginFromHome() {
        navigateToHome();
        HomePage homePage = new HomePage(driver);
        
        homePage.clickLogin();
        waitForPageLoad();
        
        Assert.assertTrue(getCurrentUrl().contains("/auth/signin"), 
            "Login should navigate to signin");
        
        System.out.println("✅ Login CTA works from homepage");
    }
}
