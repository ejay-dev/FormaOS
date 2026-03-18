package com.formaos.pages;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;

public class HomePage extends BasePage {
    
    // Locators
    // Updated selectors to match FigmaHomepage implementation
    private By startFreeTrialButton = By.cssSelector("a[href='/auth'], a[href='/auth/signup']");
    private By requestDemoButton = By.cssSelector("a[href='/contact']");
    private By loginLink = By.xpath("//a[contains(text(), 'Login')]");
    private By productLink = By.xpath("//a[@href='/product']");
    private By industriesLink = By.xpath("//a[@href='/industries']");
    private By securityLink = By.xpath("//a[@href='/security']");
    private By pricingLink = By.xpath("//a[@href='/pricing']");
    private By contactLink = By.xpath("//a[@href='/contact']");
    
    public HomePage(WebDriver driver) {
        super(driver);
    }
    
    public void clickStartFreeTrial() {
        click(startFreeTrialButton);
    }
    
    public void clickRequestDemo() {
        click(requestDemoButton);
    }
    
    public void clickLogin() {
        click(loginLink);
    }
    
    public void navigateToProduct() {
        click(productLink);
    }
    
    public void navigateToIndustries() {
        click(industriesLink);
    }
    
    public void navigateToSecurity() {
        click(securityLink);
    }
    
    public void navigateToPricing() {
        click(pricingLink);
    }
    
    public void navigateToContact() {
        click(contactLink);
    }
    
    public boolean isStartFreeTrialDisplayed() {
        return isElementDisplayed(startFreeTrialButton);
    }
    
    public boolean isRequestDemoDisplayed() {
        return isElementDisplayed(requestDemoButton);
    }
}
