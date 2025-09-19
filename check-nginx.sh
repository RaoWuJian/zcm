#!/bin/bash

# Nginx状态检查脚本
# 用于排查yanqi1.com网站无法访问的问题

echo "========================================="
echo "Nginx状态检查脚本 - yanqi1.com"
echo "========================================="
echo

# 1. 检查nginx服务状态
echo "1. 检查nginx服务状态:"
systemctl is-active nginx
systemctl status nginx --no-pager -l
echo

# 2. 检查nginx配置
echo "2. 检查nginx配置:"
nginx -t
echo

# 3. 检查端口监听
echo "3. 检查端口监听:"
echo "HTTP端口(80):"
netstat -tlnp | grep :80
echo "HTTPS端口(443):"
netstat -tlnp | grep :443
echo

# 4. 检查nginx进程
echo "4. 检查nginx进程:"
ps aux | grep nginx | grep -v grep
echo

# 5. 检查SSL证书文件
echo "5. 检查SSL证书文件:"
if [ -f "/etc/ssl/yanqi1.com.pem" ]; then
    echo "✓ 证书文件存在: /etc/ssl/yanqi1.com.pem"
    ls -la /etc/ssl/yanqi1.com.pem
else
    echo "✗ 证书文件不存在: /etc/ssl/yanqi1.com.pem"
fi

if [ -f "/etc/ssl/yanqi1.com.key" ]; then
    echo "✓ 私钥文件存在: /etc/ssl/yanqi1.com.key"
    ls -la /etc/ssl/yanqi1.com.key
else
    echo "✗ 私钥文件不存在: /etc/ssl/yanqi1.com.key"
fi
echo

# 6. 检查网站目录
echo "6. 检查网站目录:"
if [ -d "/www/wwwroot/yanqi1.com" ]; then
    echo "✓ 网站目录存在: /www/wwwroot/yanqi1.com"
    ls -la /www/wwwroot/yanqi1.com/ | head -10
else
    echo "✗ 网站目录不存在: /www/wwwroot/yanqi1.com"
fi
echo

# 7. 检查启用的站点
echo "7. 检查启用的站点:"
echo "sites-available:"
ls -la /etc/nginx/sites-available/ | grep yanqi1
echo "sites-enabled:"
ls -la /etc/nginx/sites-enabled/ | grep yanqi1
echo

# 8. 检查域名解析
echo "8. 检查域名解析:"
echo "本地解析:"
nslookup yanqi1.com
echo "公网解析:"
dig yanqi1.com +short
echo

# 9. 检查服务器IP
echo "9. 检查服务器IP:"
curl -s ifconfig.me
echo
echo

# 10. 测试HTTP/HTTPS连接
echo "10. 测试连接:"
echo "测试HTTP连接:"
curl -I -s --connect-timeout 5 http://yanqi1.com || echo "HTTP连接失败"
echo
echo "测试HTTPS连接:"
curl -I -s --connect-timeout 5 https://yanqi1.com || echo "HTTPS连接失败"
echo

# 11. 检查防火墙
echo "11. 检查防火墙:"
if command -v ufw &> /dev/null; then
    echo "UFW状态:"
    ufw status
else
    echo "UFW未安装"
fi
echo "iptables规则:"
iptables -L INPUT | grep -E "(80|443|ACCEPT|DROP)"
echo

# 12. 检查日志文件
echo "12. 检查日志文件:"
if [ -f "/www/wwwlogs/yanqi1.com.error.log" ]; then
    echo "✓ 错误日志存在，最近10行:"
    tail -10 /www/wwwlogs/yanqi1.com.error.log
else
    echo "✗ 错误日志不存在: /www/wwwlogs/yanqi1.com.error.log"
fi
echo

if [ -f "/www/wwwlogs/yanqi1.com.log" ]; then
    echo "✓ 访问日志存在，最近5行:"
    tail -5 /www/wwwlogs/yanqi1.com.log
else
    echo "✗ 访问日志不存在: /www/wwwlogs/yanqi1.com.log"
fi
echo

# 13. 检查nginx配置中的yanqi1.com
echo "13. 检查nginx配置中的yanqi1.com:"
nginx -T 2>/dev/null | grep -A 5 -B 5 yanqi1.com
echo

echo "========================================="
echo "检查完成！"
echo "========================================="

# 提供建议
echo
echo "常见问题解决建议:"
echo "1. 如果nginx未运行: systemctl start nginx"
echo "2. 如果配置有误: 检查配置文件语法"
echo "3. 如果端口未监听: 检查防火墙和配置"
echo "4. 如果域名解析错误: 检查DNS设置"
echo "5. 如果SSL证书问题: 检查证书文件路径和权限"
