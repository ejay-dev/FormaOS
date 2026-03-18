package com.formaos.utils;

import org.testng.ITestContext;
import org.testng.ITestListener;
import org.testng.ITestResult;

public class TestListener implements ITestListener {
    
    @Override
    public void onTestStart(ITestResult result) {
        System.out.println("\n========================================");
        System.out.println("TEST STARTED: " + result.getMethod().getMethodName());
        System.out.println("========================================");
    }
    
    @Override
    public void onTestSuccess(ITestResult result) {
        System.out.println("\n✅ TEST PASSED: " + result.getMethod().getMethodName());
    }
    
    @Override
    public void onTestFailure(ITestResult result) {
        System.out.println("\n❌ TEST FAILED: " + result.getMethod().getMethodName());
        System.out.println("Failure Reason: " + result.getThrowable().getMessage());
    }
    
    @Override
    public void onTestSkipped(ITestResult result) {
        System.out.println("\n⏭️ TEST SKIPPED: " + result.getMethod().getMethodName());
    }
    
    @Override
    public void onStart(ITestContext context) {
        System.out.println("\n╔════════════════════════════════════════╗");
        System.out.println("║   FORMAOS ENTERPRISE TEST SUITE        ║");
        System.out.println("║   Suite: " + context.getName() + "                    ║");
        System.out.println("╚════════════════════════════════════════╝\n");
    }
    
    @Override
    public void onFinish(ITestContext context) {
        System.out.println("\n╔════════════════════════════════════════╗");
        System.out.println("║   TEST SUITE COMPLETED                 ║");
        System.out.println("║   Passed: " + context.getPassedTests().size() + "                              ║");
        System.out.println("║   Failed: " + context.getFailedTests().size() + "                              ║");
        System.out.println("║   Skipped: " + context.getSkippedTests().size() + "                             ║");
        System.out.println("╚════════════════════════════════════════╝\n");
    }
}
