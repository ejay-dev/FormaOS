package com.formaos.tests;

import com.formaos.base.BaseTest;
import org.testng.Assert;
import org.testng.annotations.Test;

public class AuthFlowTests extends BaseTest {
    
    @Test(priority = 1, description = "Verify signup page is accessible")
    public void testSignupPageAccessible() {
        navigateTo("/auth/signup");
        waitForPageLoad();
        
        String currentUrl = getCurrentUrl();
        Assert.assertTrue(currentUrl.contains("/auth/signup"), 
            "Should be on signup page");
        
        System.out.println("✅ Signup page accessible");
    }
    
    @Test(priority = 2, description = "Verify login page is accessible")
    public void testLoginPageAccessible() {
        navigateTo("/auth/signin");
        waitForPageLoad();
        
        String currentUrl = getCurrentUrl();
        Assert.assertTrue(currentUrl.contains("/auth/signin"), 
            "Should be on signin page");
        
        System.out.println("✅ Login page accessible");
    }
    
    @Test(priority = 3, description = "Verify navigation between login and signup")
    public void testAuthPageNavigation() {
        navigateTo("/auth/signin");
        waitForPageLoad();
        
        // Navigate to signup from login
        navigateTo("/auth/signup");
        waitForPageLoad();
        Assert.assertTrue(getCurrentUrl().contains("/signup"), 
            "Should be on signup page");
        
        // Navigate back to login
        navigateTo("/auth/signin");
        waitForPageLoad();
        Assert.assertTrue(getCurrentUrl().contains("/signin"), 
            "Should be on signin page");
        
        System.out.println("✅ Auth page navigation functional");
    }
}
