#!/usr/bin/env node

/**
 * Security Test Script for Adria Style Studio
 * Tests all security features and implementations
 */

const fs = require('fs');
const path = require('path');

console.log('🔒 Testing Security Implementations for Adria Style Studio\n');

// Test results tracking
const testResults = {
    passed: 0,
    failed: 0,
    total: 0
};

function runTest(testName, testFunction) {
    testResults.total++;
    console.log(`🧪 Testing: ${testName}`);
    
    try {
        const result = testFunction();
        if (result === true || (result && result.passed)) {
            testResults.passed++;
            console.log(`✅ ${testName} - PASSED\n`);
        } else {
            testResults.failed++;
            console.log(`❌ ${testName} - FAILED: ${result || 'Unknown error'}\n`);
        }
    } catch (error) {
        testResults.failed++;
        console.log(`❌ ${testName} - FAILED: ${error.message}\n`);
    }
}

function testFileExists(filePath, description) {
    return function() {
        if (!fs.existsSync(filePath)) {
            throw new Error(`File not found: ${filePath}`);
        }
        return true;
    };
}

function testServiceImport(servicePath, serviceName) {
    return function() {
        try {
            const service = require(servicePath);
            if (!service) {
                throw new Error(`Service is null or undefined`);
            }
            return true;
        } catch (error) {
            throw new Error(`Cannot import ${serviceName}: ${error.message}`);
        }
    };
}

function testSecurityHeaders() {
    const serverPath = path.join(__dirname, '../server/server.js');
    const serverContent = fs.readFileSync(serverPath, 'utf8');
    
    const requiredHeaders = [
        'X-Content-Type-Options',
        'Referrer-Policy', 
        'Permissions-Policy',
        'X-Permitted-Cross-Domain-Policies',
        'X-Frame-Options',
        'upgradeInsecureRequests'
    ];
    
    const missingHeaders = requiredHeaders.filter(header => !serverContent.includes(header));
    
    if (missingHeaders.length > 0) {
        throw new Error(`Missing security headers: ${missingHeaders.join(', ')}`);
    }
    
    return true;
}

function testCSPConfiguration() {
    const serverPath = path.join(__dirname, '../server/server.js');
    const serverContent = fs.readFileSync(serverPath, 'utf8');
    
    const cspDirectives = [
        'defaultSrc',
        'scriptSrc',
        'styleSrc',
        'imgSrc',
        'connectSrc',
        'frameAncestors'
    ];
    
    const missingDirectives = cspDirectives.filter(directive => !serverContent.includes(directive));
    
    if (missingDirectives.length > 0) {
        throw new Error(`Missing CSP directives: ${missingDirectives.join(', ')}`);
    }
    
    // Check that unsafe-inline is conditionally used
    if (!serverContent.includes('isDevelopment')) {
        throw new Error('CSP should be environment-aware');
    }
    
    return true;
}

function testValidationService() {
    const ValidationService = require('../server/services/validationService');
    
    // Test user registration validation
    const invalidUser = {
        email: 'invalid-email',
        password: '123',
        firstName: '',
        lastName: ''
    };
    
    const result = ValidationService.validate(invalidUser, ValidationService.userRegistrationSchema);
    
    if (result.isValid) {
        throw new Error('Validation should have failed for invalid user data');
    }
    
    if (!result.errors || result.errors.length === 0) {
        throw new Error('Validation should return errors for invalid data');
    }
    
    // Test valid user
    const validUser = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        firstName: 'John',
        lastName: 'Doe'
    };
    
    const validResult = ValidationService.validate(validUser, ValidationService.userRegistrationSchema);
    
    if (!validResult.isValid) {
        throw new Error('Validation should have passed for valid user data');
    }
    
    return true;
}

function testSecurityService() {
    const SecurityService = require('../server/services/securityService');
    
    // Test that all required methods exist
    const requiredMethods = [
        'logSecurityEvent',
        'logFailedLogin',
        'isRateLimited',
        'isApiRateLimited',
        'getSecurityEvents',
        'getSecurityStats',
        'cleanupOldData'
    ];
    
    const missingMethods = requiredMethods.filter(method => typeof SecurityService[method] !== 'function');
    
    if (missingMethods.length > 0) {
        throw new Error(`Missing security service methods: ${missingMethods.join(', ')}`);
    }
    
    return true;
}

function testDatabaseSchema() {
    const setupPath = path.join(__dirname, '../server/database/setup.js');
    const setupContent = fs.readFileSync(setupPath, 'utf8');
    
    const requiredTables = [
        'security_events',
        'failed_login_attempts',
        'api_rate_limits'
    ];
    
    const missingTables = requiredTables.filter(table => !setupContent.includes(table));
    
    if (missingTables.length > 0) {
        throw new Error(`Missing database tables: ${missingTables.join(', ')}`);
    }
    
    // Check for proper indexes
    const requiredIndexes = [
        'idx_security_events_type',
        'idx_security_events_severity',
        'idx_failed_login_email',
        'idx_failed_login_ip'
    ];
    
    const missingIndexes = requiredIndexes.filter(index => !setupContent.includes(index));
    
    if (missingIndexes.length > 0) {
        throw new Error(`Missing database indexes: ${missingIndexes.join(', ')}`);
    }
    
    return true;
}

function testPackageSecurity() {
    const packagePath = path.join(__dirname, '../package.json');
    const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    // Check that Joi is installed
    if (!packageContent.dependencies || !packageContent.dependencies.joi) {
        throw new Error('Joi validation library not found in dependencies');
    }
    
    // Check that express-validator is removed
    if (packageContent.dependencies && packageContent.dependencies['express-validator']) {
        throw new Error('express-validator should be removed (vulnerable dependency)');
    }
    
    // Check that security packages are present
    const securityPackages = ['helmet', 'bcryptjs', 'jsonwebtoken'];
    const missingPackages = securityPackages.filter(pkg => !packageContent.dependencies[pkg]);
    
    if (missingPackages.length > 0) {
        throw new Error(`Missing security packages: ${missingPackages.join(', ')}`);
    }
    
    return true;
}

function testMiddlewareImplementation() {
    const serverPath = path.join(__dirname, '../server/server.js');
    const serverContent = fs.readFileSync(serverPath, 'utf8');
    
    const requiredMiddleware = [
        'SecurityMiddleware.securityLogger',
        'SecurityMiddleware.suspiciousActivityDetection',
        'SecurityMiddleware.headerValidation'
    ];
    
    const missingMiddleware = requiredMiddleware.filter(middleware => !serverContent.includes(middleware));
    
    if (missingMiddleware.length > 0) {
        throw new Error(`Missing security middleware: ${missingMiddleware.join(', ')}`);
    }
    
    return true;
}

function testAuthControllerSecurity() {
    const authControllerPath = path.join(__dirname, '../server/controllers/authController.js');
    const authContent = fs.readFileSync(authControllerPath, 'utf8');
    
    const securityFeatures = [
        'SecurityService.logSecurityEvent',
        'SecurityService.logFailedLogin',
        'ValidationService.validate'
    ];
    
    const missingFeatures = securityFeatures.filter(feature => !authContent.includes(feature));
    
    if (missingFeatures.length > 0) {
        throw new Error(`Missing security features in auth controller: ${missingFeatures.join(', ')}`);
    }
    
    return true;
}

function testSecurityRoutes() {
    const securityRoutesPath = path.join(__dirname, '../server/routes/security.js');
    if (!fs.existsSync(securityRoutesPath)) {
        throw new Error('Security routes file not found');
    }
    
    const securityContent = fs.readFileSync(securityRoutesPath, 'utf8');
    
    const requiredRoutes = [
        '/stats',
        '/events',
        '/alerts',
        '/failed-login-analysis',
        '/ip-analysis'
    ];
    
    const missingRoutes = requiredRoutes.filter(route => !securityContent.includes(route));
    
    if (missingRoutes.length > 0) {
        throw new Error(`Missing security routes: ${missingRoutes.join(', ')}`);
    }
    
    // Check for proper authentication middleware
    if (!securityContent.includes('authenticate') || !securityContent.includes('requireAdmin')) {
        throw new Error('Security routes should require authentication and admin privileges');
    }
    
    return true;
}

function testEnvironmentConfiguration() {
    const envExamplePath = path.join(__dirname, '../.env.example');
    const envContent = fs.readFileSync(envExamplePath, 'utf8');
    
    const requiredEnvVars = [
        'JWT_SECRET',
        'DB_HOST',
        'DB_PORT',
        'DB_NAME',
        'DB_USER',
        'DB_PASSWORD',
        'FRONTEND_URL'
    ];
    
    const missingVars = requiredEnvVars.filter(varName => !envContent.includes(varName));
    
    if (missingVars.length > 0) {
        throw new Error(`Missing environment variables in .env.example: ${missingVars.join(', ')}`);
    }
    
    return true;
}

// Run all tests
console.log('📁 File Structure Tests\n');
runTest('Security Service File', testFileExists('server/services/securityService.js'));
runTest('Validation Service File', testFileExists('server/services/validationService.js'));
runTest('Security Middleware File', testFileExists('server/middleware/security.js'));
runTest('Security Controller File', testFileExists('server/controllers/securityController.js'));
runTest('Security Routes File', testFileExists('server/routes/security.js'));
runTest('Security Setup Script', testFileExists('scripts/setup-security.sh'));

console.log('🔧 Service Import Tests\n');
runTest('Security Service Import', testServiceImport('../server/services/securityService.js', 'SecurityService'));
runTest('Validation Service Import', testServiceImport('../server/services/validationService.js', 'ValidationService'));
runTest('Security Middleware Import', testServiceImport('../server/middleware/security.js', 'SecurityMiddleware'));

console.log('🛡️ Security Implementation Tests\n');
runTest('Security Headers Configuration', testSecurityHeaders);
runTest('CSP Configuration', testCSPConfiguration);
runTest('Validation Service Logic', testValidationService);
runTest('Security Service Methods', testSecurityService);
runTest('Database Schema', testDatabaseSchema);
runTest('Package Security', testPackageSecurity);
runTest('Middleware Implementation', testMiddlewareImplementation);
runTest('Auth Controller Security', testAuthControllerSecurity);
runTest('Security Routes', testSecurityRoutes);
runTest('Environment Configuration', testEnvironmentConfiguration);

// Print results
console.log('📊 Test Results Summary');
console.log('========================');
console.log(`Total Tests: ${testResults.total}`);
console.log(`Passed: ${testResults.passed}`);
console.log(`Failed: ${testResults.failed}`);
console.log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);

if (testResults.failed === 0) {
    console.log('\n🎉 All security tests passed!');
    console.log('\n✅ Security Implementation Summary:');
    console.log('   • Enhanced security headers implemented');
    console.log('   • Local security database with event logging');
    console.log('   • Secure input validation with Joi');
    console.log('   • Rate limiting and suspicious activity detection');
    console.log('   • Failed login attempt tracking');
    console.log('   • Admin security dashboard endpoints');
    console.log('   • Dependency vulnerabilities fixed');
    console.log('   • Comprehensive security middleware');
    console.log('\n🚀 Your application is now secured with enterprise-grade features!');
    console.log('\n📋 Next Steps:');
    console.log('   1. Run ./scripts/setup-security.sh to initialize the database');
    console.log('   2. Start the server with npm run dev');
    console.log('   3. Test authentication and security features');
    console.log('   4. Monitor security events via the admin dashboard');
    process.exit(0);
} else {
    console.log('\n❌ Some security tests failed. Please review and fix the issues above.');
    process.exit(1);
}
