# Infrastructure as Code (Terraform)

A comprehensive Terraform configuration for deploying application infrastructure on Google Cloud Platform (GCP) with multi-environment support.

## 🏗️ Overview

This Terraform configuration provisions a complete cloud infrastructure for your application, including:

- **Virtual Private Cloud (VPC)** with public and private subnets
- **Compute Engine instances** for application hosting
- **DNS management** with Cloud DNS for domain routing
- **Firewall rules** for secure network access
- **Multi-environment support** (main/production and staging)

## ✨ Infrastructure Components

### 🌐 Network Architecture
- **VPC Network**: Isolated virtual network with regional routing
- **Public Subnets**: 3 subnets across different zones for high availability
- **Private Subnets**: 3 private subnets for internal resources
- **Internet Gateway**: Router for external internet access
- **Firewall Rules**: Secure access control for SSH, HTTP, HTTPS, and application ports

### 🖥️ Compute Resources
- **VM Instances**: Google Compute Engine instances running your application
- **Custom Images**: Uses pre-built application images from specified families
- **Machine Types**: Configurable instance sizes (default: e2-medium)
- **Persistent Disks**: 20GB balanced persistent disks for storage

### 🌍 DNS Management
- **Managed DNS Zone**: Cloud DNS zone for ${var.project_name}.${var.domain_name}
- **Environment-specific Records**: 
  - Production: `api.${var.project_name}.${var.domain_name}`
  - Staging: `staging.${var.project_name}.${var.domain_name}`
- **Automatic IP Resolution**: DNS records automatically point to VM external IPs

### 🔒 Security Features
- **Network Segmentation**: Separate public and private subnets
- **Firewall Rules**: Restrictive access control
- **Service Accounts**: Proper IAM roles and permissions
- **Environment Isolation**: Separate resources per environment

## 📁 Project Structure

```
terraform/
├── provider.tf              # GCP provider configuration and API enablement
├── versions.tf              # Terraform and provider version constraints
├── variables.tf             # Input variable definitions
├── vpc.tf                   # VPC, subnets, firewall, and compute resources
├── dns.tf                   # DNS zone and record management
├── terraform.main.tfvars    # Production environment variables
├── terraform.staging.tfvars # Staging environment variables
├── .terraform.lock.hcl      # Provider version lock file
├── terraform.tfstate        # Terraform state file (managed)
└── README.md                # This documentation
```

## 🚀 Quick Start

### Prerequisites
- **Terraform**: v1.0+ installed
- **Google Cloud SDK**: `gcloud` CLI configured
- **GCP Project**: Active project with billing enabled
- **Authentication**: Service account key or `gcloud auth application-default login`
- **Required APIs**: Compute Engine API, DNS API (automatically enabled)

### Initial Setup

1. **Clone and navigate to terraform directory:**
   ```bash
   cd terraform
   ```

2. **Configure variables:**
   ```bash
   # Copy example files and customize with your values
   cp terraform.main.tfvars terraform.main.tfvars.example
   cp terraform.staging.tfvars terraform.staging.tfvars.example
   
   # Edit with your specific configuration
   vim terraform.main.tfvars
   vim terraform.staging.tfvars
   ```

3. **Initialize Terraform:**
   ```bash
   terraform init
   ```

4. **Validate configuration:**
   ```bash
   terraform validate
   ```

5. **Review planned changes:**
   ```bash
   # For production environment
   terraform plan -var-file="terraform.main.tfvars"
   
   # For staging environment
   terraform plan -var-file="terraform.staging.tfvars"
   ```

### Deployment

#### Production Environment
```bash
# Deploy to production
terraform apply -var-file="terraform.main.tfvars"

# Verify deployment
terraform output -json
```

#### Staging Environment
```bash
# Deploy to staging
terraform apply -var-file="terraform.staging.tfvars"

# Check staging resources
terraform output instance_external_ip
```

## ⚙️ Configuration

### Environment Variables

#### Production (`terraform.main.tfvars`)
```hcl
# GCP Configuration
project_id = var.project_id
region     = var.region
zones      = var.zones

# Environment
environment = "main"

# VM Configuration
instance_name = "${var.environment}-${var.project_name}-vm"
image_family  = "${var.project_name}-production-family"
machine_type  = var.machine_type

# Network Configuration
vpc_cidr = var.vpc_cidr
public_subnet_cidrs = var.public_subnet_cidrs
private_subnet_cidrs = var.private_subnet_cidrs

# Domain Configuration
domain_name = var.domain_name
app_port    = var.app_port
```

#### Staging (`terraform.staging.tfvars`)
```hcl
# Similar configuration with staging-specific values
environment = "staging"
instance_name = "${var.environment}-${var.project_name}-vm"
image_family  = "${var.project_name}-staging-family"
```

### Variable Definitions

| Variable | Type | Description | Example Value |
|----------|------|-------------|---------------|
| `project_id` | string | GCP project ID | `"my-project-123"` |
| `region` | string | GCP region for resources | `"us-central1"` |
| `zones` | list(string) | Availability zones for subnets | `["us-central1-a", "us-central1-b", "us-central1-c"]` |
| `environment` | string | Environment name (main/staging) | `"main"` or `"staging"` |
| `instance_name` | string | VM instance name | `"${var.environment}-${var.project_name}-vm"` |
| `image_family` | string | Custom image family for VM | `"${var.project_name}-${var.environment}-family"` |
| `machine_type` | string | VM machine type | `"e2-medium"` |
| `vpc_cidr` | string | VPC CIDR block | `"10.0.0.0/16"` |
| `public_subnet_cidrs` | list(string) | Public subnet CIDR blocks | `["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]` |
| `private_subnet_cidrs` | list(string) | Private subnet CIDR blocks | `["10.0.10.0/24", "10.0.20.0/24", "10.0.30.0/24"]` |
| `domain_name` | string | Base domain name | `"example.com"` |
| `app_port` | number | Application port | `3000` |

### Customization Guide

Before deploying, customize the `.tfvars` files with your specific values:

1. **Update GCP Configuration:**
   - Set your actual GCP project ID
   - Choose your preferred region and zones
   - Ensure you have proper permissions in the project

2. **Configure Networking:**
   - Adjust CIDR blocks to avoid conflicts with existing networks
   - Ensure subnet sizes meet your capacity requirements

3. **Set Domain Configuration:**
   - Use your actual domain name
   - Ensure you have DNS management permissions for the domain

4. **Choose Instance Configuration:**
   - Select appropriate machine types for your workload
   - Configure custom image families if using pre-built images

## 🌐 Network Architecture

### VPC Design
```
VPC Network (${var.vpc_cidr})
├── Public Subnets
│   ├── ${var.environment}-public-subnet-1 (${var.public_subnet_cidrs[0]}) - ${var.zones[0]}
│   ├── ${var.environment}-public-subnet-2 (${var.public_subnet_cidrs[1]}) - ${var.zones[1]}
│   └── ${var.environment}-public-subnet-3 (${var.public_subnet_cidrs[2]}) - ${var.zones[2]}
├── Private Subnets
│   ├── ${var.environment}-private-subnet-1 (${var.private_subnet_cidrs[0]}) - ${var.zones[0]}
│   ├── ${var.environment}-private-subnet-2 (${var.private_subnet_cidrs[1]}) - ${var.zones[1]}
│   └── ${var.environment}-private-subnet-3 (${var.private_subnet_cidrs[2]}) - ${var.zones[2]}
└── Internet Gateway (${var.environment}-router)
```

### Firewall Rules
- **SSH Access**: Port 22 from anywhere (0.0.0.0/0)
- **HTTP Access**: Port 80 from anywhere
- **HTTPS Access**: Port 443 from anywhere
- **Application Access**: Port ${var.app_port} from anywhere
- **Target Tags**: `${var.project_name}-vm` for all rules

## 🌍 DNS Configuration

### DNS Zone Management
- **Zone Name**: `${var.project_name}.${var.domain_name}`
- **Environment-specific Records**:
  - **Production**: `api.${var.project_name}.${var.domain_name}` → VM External IP
  - **Staging**: `staging.${var.project_name}.${var.domain_name}` → VM External IP
- **TTL**: 300 seconds for quick updates
- **Automatic IP Resolution**: DNS records automatically use VM external IPs

### DNS Outputs
```bash
# Get DNS nameservers
terraform output dns_nameservers

# Get DNS record information
terraform output dns_records
```

## 📊 Terraform Outputs

### Available Outputs

| Output | Description |
|--------|-------------|
| `vpc_network_name` | Name of the created VPC network |
| `public_subnet_names` | Names of all public subnets |
| `private_subnet_names` | Names of all private subnets |
| `instance_name` | Name of the VM instance |
| `instance_external_ip` | External IP address of the VM |
| `instance_internal_ip` | Internal IP address of the VM |
| `dns_nameservers` | DNS nameservers for the zone |
| `dns_records` | Created DNS records information |

### Viewing Outputs
```bash
# View all outputs
terraform output

# View specific output
terraform output instance_external_ip

# View outputs in JSON format
terraform output -json
```

## 🔧 Management Commands

### State Management
```bash
# View current state
terraform show

# List all resources
terraform state list

# Import existing resource
terraform import google_compute_instance.vm_instance projects/${var.project_id}/zones/${var.zones[0]}/instances/${var.instance_name}

# Remove resource from state
terraform state rm google_compute_instance.vm_instance
```

### Environment Switching
```bash
# Switch to production
terraform workspace select production
terraform apply -var-file="terraform.main.tfvars"

# Switch to staging
terraform workspace select staging
terraform apply -var-file="terraform.staging.tfvars"
```

## 🛡️ Security Best Practices

### Network Security
- **Private Subnets**: Sensitive resources in private subnets
- **Firewall Rules**: Minimal required access only
- **Network Tags**: Proper resource tagging for firewall targeting
- **Regional Routing**: Optimized network routing mode

### Access Control
- **Service Accounts**: Proper IAM roles for VM instances
- **SSH Access**: Controlled SSH access with proper key management
- **API Access**: Required APIs enabled with minimal permissions

### Environment Isolation
- **Separate Resources**: Complete isolation between environments
- **Naming Conventions**: Clear environment-specific naming
- **State Separation**: Separate state files per environment

## 🚀 Deployment Strategies

### Blue-Green Deployment
```bash
# Create new environment
terraform apply -var-file="terraform.main.tfvars" -var="instance_name=${var.environment}-${var.project_name}-vm-new"

# Update DNS to point to new instance
# Destroy old instance after verification
```

### Rolling Updates
```bash
# Update VM image
terraform apply -var-file="terraform.main.tfvars" -var="image_family=${var.project_name}-production-family-v2"
```

### Disaster Recovery
```bash
# Backup state file
cp terraform.tfstate terraform.tfstate.backup.$(date +%Y%m%d)

# Restore from backup if needed
cp terraform.tfstate.backup.YYYYMMDD terraform.tfstate
```

## 🔍 Troubleshooting

### Common Issues

#### Authentication Errors
```bash
# Re-authenticate with gcloud
gcloud auth application-default login

# Verify project access
gcloud projects list
```

#### State Lock Issues
```bash
# Force unlock (use with caution)
terraform force-unlock LOCK_ID

# Check state lock status
terraform state list
```

#### Resource Conflicts
```bash
# Import existing resources
terraform import google_compute_network.vpc_network projects/${var.project_id}/global/networks/${var.environment}-${var.project_name}-vpc

# Remove conflicting resources
terraform state rm google_compute_network.vpc_network
```

#### DNS Propagation
```bash
# Check DNS propagation
nslookup api.${var.project_name}.${var.domain_name}

# Verify nameservers
dig NS ${var.project_name}.${var.domain_name}
```

### Validation Commands
```bash
# Validate Terraform syntax
terraform validate

# Format Terraform files
terraform fmt -recursive

# Check for security issues
terraform plan -out=tfplan
terraform show -json tfplan | jq '.'
```

## 📈 Monitoring & Maintenance

### Resource Monitoring
- **GCP Console**: Monitor resources through GCP Console
- **Cloud Monitoring**: Set up alerts for VM health
- **DNS Monitoring**: Monitor DNS resolution and propagation
- **Cost Monitoring**: Track infrastructure costs

### Regular Maintenance
```bash
# Update Terraform providers
terraform init -upgrade

# Refresh state with actual infrastructure
terraform refresh -var-file="terraform.main.tfvars"

# Plan for drift detection
terraform plan -var-file="terraform.main.tfvars"
```

## 🧹 Cleanup

### Destroy Resources
```bash
# Destroy staging environment
terraform destroy -var-file="terraform.staging.tfvars"

# Destroy production environment (use with extreme caution)
terraform destroy -var-file="terraform.main.tfvars"

# Destroy specific resources
terraform destroy -target=google_compute_instance.vm_instance -var-file="terraform.staging.tfvars"
```

## 📚 Additional Resources

- [Terraform GCP Provider Documentation](https://registry.terraform.io/providers/hashicorp/google/latest/docs)
- [Google Cloud Compute Engine Documentation](https://cloud.google.com/compute/docs)
- [Google Cloud DNS Documentation](https://cloud.google.com/dns/docs)
- [Terraform Best Practices](https://www.terraform.io/docs/cloud/guides/recommended-practices/index.html)

---

**Terraform Version**: 1.0+  
**GCP Provider Version**: 4.0+  
**Target Platform**: Google Cloud Platform  
**Supported Environments**: Production (main), Staging