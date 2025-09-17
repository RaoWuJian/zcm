# getImageUrl 函数名修复说明

## 问题描述

在代码中出现了 `ReferenceError: getImageUrl is not defined` 错误，这是因为代码中存在函数名不一致的问题：

- **定义的函数名**：`getImageUrlSync`
- **调用的函数名**：`getImageUrl`（错误）

## 修复内容

### 1. 函数调用名称统一

将所有错误的 `getImageUrl` 调用修改为正确的 `getImageUrlSync`：

#### 修复位置 1：getPreviewList 函数
```javascript
// 修复前
const getPreviewList = () => {
  return form.images.map(image => getImageUrl(image))
}

// 修复后
const getPreviewList = () => {
  return form.images.map(image => getImageUrlSync(image))
}
```

#### 修复位置 2：removeImage 函数
```javascript
// 修复前
if (image instanceof File) {
  URL.revokeObjectURL(getImageUrl(image))
}

// 修复后
if (image instanceof File) {
  const url = getImageUrlSync(image)
  URL.revokeObjectURL(url)
}
```

#### 修复位置 3：resetForm 函数
```javascript
// 修复前
form.images.forEach(image => {
  if (image instanceof File) {
    URL.revokeObjectURL(getImageUrl(image))
  }
})

// 修复后
form.images.forEach(image => {
  if (image instanceof File) {
    const url = getImageUrlSync(image)
    URL.revokeObjectURL(url)
  }
})
```

### 2. 逻辑优化

在修复函数名的同时，也优化了 URL 释放的逻辑：

- **之前的问题**：直接将 `getImageUrlSync(image)` 的结果传给 `URL.revokeObjectURL`
- **优化后**：先获取 URL，再释放，逻辑更清晰

## 函数说明

### getImageUrlSync 函数

```javascript
const getImageUrlSync = (image) => {
  // 如果是临时文件（File对象），创建本地URL
  if (image instanceof File) {
    return URL.createObjectURL(image)
  }
  
  // 如果是已保存的文件
  const imageId = typeof image === 'string' ? image : (image._id || image.id)
  
  if (!imageId) {
    return ''
  }
  
  // 生成文件访问URL（不需要token）
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'
  const url = `${baseUrl}/files/${imageId}`
  
  return url
}
```

**功能**：
- 处理临时文件（File 对象）：使用 `URL.createObjectURL` 创建本地预览URL
- 处理已保存文件：生成服务器文件访问URL
- 统一的错误处理：返回空字符串

### 相关函数

#### getPreviewImageUrls
```javascript
const getPreviewImageUrls = () => {
  if (!previewImages.value || !Array.isArray(previewImages.value)) {
    return []
  }
  return previewImages.value.map(image => getImageUrlSync(image)).filter(url => url)
}
```

#### getFormImageUrls
```javascript
const getFormImageUrls = () => {
  if (!form.images || !Array.isArray(form.images)) {
    return []
  }
  return form.images.map(image => getImageUrlSync(image)).filter(url => url)
}
```

## 内存管理

### URL 对象的生命周期

1. **创建**：`URL.createObjectURL(file)` 为 File 对象创建临时URL
2. **使用**：在图片预览中使用这个URL
3. **释放**：`URL.revokeObjectURL(url)` 释放内存

### 释放时机

- **删除图片时**：在 `removeImage` 函数中释放
- **重置表单时**：在 `resetForm` 函数中释放
- **组件销毁时**：应该在组件销毁时释放所有临时URL

## 错误预防

### 1. 函数命名一致性

确保所有地方使用相同的函数名：
- 定义：`getImageUrlSync`
- 调用：`getImageUrlSync`

### 2. 类型检查

在调用前检查参数类型：
```javascript
if (image instanceof File) {
  // 处理 File 对象
} else if (image && (image._id || image.id)) {
  // 处理已保存的图片对象
}
```

### 3. 错误处理

添加适当的错误处理：
```javascript
try {
  const url = getImageUrlSync(image)
  if (url) {
    URL.revokeObjectURL(url)
  }
} catch (error) {
  console.error('释放URL失败:', error)
}
```

## 测试验证

### 1. 功能测试

1. **图片上传**：选择图片后能正常预览
2. **图片删除**：删除图片不会报错
3. **表单重置**：重置表单不会报错
4. **编辑模式**：编辑已有记录时图片正常显示

### 2. 控制台检查

打开浏览器控制台，确认：
- 没有 `getImageUrl is not defined` 错误
- 没有其他相关的 JavaScript 错误
- 图片URL生成正常

### 3. 内存泄漏检查

在开发者工具的 Memory 面板中：
- 检查是否有未释放的 Blob URL
- 确认内存使用正常

## 总结

通过这次修复：

1. **解决了函数未定义错误**：统一使用 `getImageUrlSync` 函数名
2. **优化了内存管理**：正确释放临时URL对象
3. **提高了代码一致性**：所有图片URL生成使用同一个函数
4. **增强了错误处理**：添加了适当的类型检查和错误处理

现在图片功能应该能够正常工作，不会再出现 `getImageUrl is not defined` 的错误。
