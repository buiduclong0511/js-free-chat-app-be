const express = require('express')
const cors = require('cors')
const { encode } = require('html-entities')

const app = express()
const port = 3000

// Mảng users và messages dùng để lưu thông tin user và message
const users = []
const messages = []

function makeid(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
      counter += 1;
    }
    return result;
}

app.use(express.json())
app.use(cors())

// API đăng ký
app.post('/api/auth/register', (req, res) => {
    // Lấy body gửi lên
    const body = req.body

    // Kiểm tra xem email này đã được user nào đăng ký chưa
    const existed = users.some(user => user.email === body.email)
    if (existed) {
        // Nếu đã đăng ký thì trả về lỗi 409 (Conflict)
        return res.status(409).json({
            message: 'Email was existed.',
        })
    }

    // Tạo user mới với id được tạo từ hàm makeId viết ở bên trên
    const newUser = {
        id: makeid(4),
        // Hàm encode của thư viện html-entities giúp mã hóa các ký tự như <, >,... thành html entities
        // Từ đó giúp tránh được xss attach
        // Tất cả các nội dung được hiển thị trên FE đều phải mã hóa thành entities
        // Tham khảo: https://viblo.asia/p/ky-thuat-tan-cong-xss-va-cach-ngan-chan-YWOZr0Py5Q0
        username: encode(body.username), 
        email: body.email,
        password: body.password, // Trong case thực tế thì chỗ này cần mã hóa password trước khi lưu vào DB.
    } 
    
    // Đẩy thông tin user mới vào mảng users
    users.push(newUser)


    // Trả về thông tin user mới được tạo ra (lưu ý không trả về password)
    return res.json({
        data: {
            id: newUser.id,
            username: newUser.username,
            email: newUser.email,
        }
    })
})

// API đăng nhập
app.post('/api/auth/login', (req, res) => {
    const body = req.body
    
    // Tìm user trùng email và password được gửi lên
    const user = users.find(user => user.email === body.email && user.password === body.password)

    if (!user) {
        // Nếu không có thì trả về mã lỗi 401 (Unauthorized)
        return res.status(401).json({
            message: 'Unauthorized.'
        }) 
    }

    return res.json({
        data: {
            id: user.id,
            username: user.username,
            email: user.email,
        },
    })
})

// API tạo messages
app.post('/api/messages', (req, res) => {
    const content = encode(req.body.content)
    const userId = req.body.userId

    // Tìm xem user id dược gửi lên có xuất hiện trong mảng users hay không
    const user = users.find(user => user.id === userId)
    if (!user) {
        // Nếu không có thì sẽ trả về 401 (Unauthorized.)
        return res.status(401).json({
            message: 'Unauthorized.'
        })
    }

    const newMessage = {
        content,
        userId
    }

    // Đẩy thông tin message mới vào mảng messages
    messages.push(newMessage)

    return res.json({
        data: newMessage
    })
})

// API lấy danh sách messages
app.get('/api/messages', (req, res) => {
    // Lấy dữ liệu là danh sách messages và đồng thời gán user vào từng message
    const data = messages.map(message => {
        // Tìm kiếm thông tin user tạo ra message
        const { id, username, email } = users.find(user => user.id === message.userId)

        return {
            content: message.content,
            userId: message.userId,
            user: {
                id,
                username,
                email,
            }
        }
    })

    return res.json({
        data
    })
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
