package com.formaos.base;

import com.formaos.utils.ConfigReader;
import com.formaos.utils.DriverFactory;
import com.formaos.utils.ScreenshotUtil;
import org.openqa.selenium.WebDriver;
import org.testng.ITestResult;
import org.testng.annotations.*;
import java.time.Duration;

/**
 * Base Test class that all test classes should extend.
 * Handles WebDriver initialization, configuration, and cleanup.
 */
public class BaseTest {
    
    protected WebDriver driver;
    protected ConfigReader config;
    protected String baseUrl;
    
    @BeforeClass
    @Parameters({"browser", "baseUrl"})
    public void setupClass(@Optional("chrome") String browser, 
                          @Optional("http://localhost:3000") String url) {
        config = new ConfigReader();
        baseUrl = url;
        System.out.println("=== Test Class Setup ===");
        System.out.println("Browser: " + browser);
        System.out.println("Base URL: " + baseUrl);
    }
    
    @BeforeMethod
    public void setup() {
        System.out.println("\n--- Starting Test ---");
        
        // Initialize WebDriver
        driver = DriverFactory.getDriver(config.getBrowser());
        
        // Configure timeouts
        driver.manage().timeouts().implicitlyWait(
            Duration.ofSeconds(config.getImplicitWait())
        );
        driver.manage().timeouts().pageLoadTimeout(
            Duration.ofSeconds(config.getPageLoadTimeout())
        );
        
        // Maximize window
        driver.manage().window().maximize();
        
        System.out.println("WebDriver initialized successfully");
    }
    
    @AfterMethod
    public void tearDown(ITestResult result) {
        System.out.println("\n--- Test Completed ---");
        System.out.println("Test Status: " + (result.isSuccess() ? "PASSED" : "FAILED"));
        
        // Take screenshot on failure
        if (!result.isSuccess() && driver != null) {
            String screenshotPath = ScreenshotUtil.captureScreenshot(
                driver, 
                result.getMethod().getMethodName()
            );
            System.out.println("Screenshot saved: " + screenshotPath);
        }
        
        // Close browser
        if (driver != null) {
            driver.quit();
            System.out.println("WebDriver closed");
        }
    }
    
    @AfterClass
    public void tearDownClass() {
        System.out.println("\n=== Test Class Completed ===\n");
    }
    
    /**
     * Navigate to a specific path relative to base URL
     */
    protected void navigateTo(String path) {
        String url = baseUrl + path;
        System.out.println("Navigating to: " + url);
        driver.get(url);
    }
    
    /**
     * Navigate to home page
     */
    protected void navigateToHome() {
        System.out.println("Navigating to: " + baseUrl);
        driver.get(baseUrl);
    }
    
    /**
     * Get current page title
     */
    protected String getPageTitle() {
        return driver.getTitle();
    }
    
    /**
     * Get current URL
     */
    protected String getCurrentUrl() {
        return driver.getCurrentUrl();
    }
    
    /**
     * Wait for page to load completely
     */
    protected void waitForPageLoad() {
        try {
            Thread.sleep(2000); // Simple wait for dynamic content
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
    }
}
