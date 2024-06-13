const blogsPerPage = 5; // 每頁顯示的網誌數量
let currentPage = 1;
let currentCategory = 'all'; // 當前選擇的分類

  
const blogs = [
    { title: "MySQL資料庫運用", link: "https://sites.google.com/view/zhangcode-database/%E9%A6%96%E9%A0%81?authuser=2", desc: "MySQL基本運用，並用WINDOWS FORM和其作配合。", img: "blog1.jpg", category: 'none' },
    
    
    // 添加更多網誌數據 cpp csharp none python
];

function displayBlogs(page) {
    const filteredBlogs = blogs.filter(blog => currentCategory === 'all' || blog.category === currentCategory);
    const start = (page - 1) * blogsPerPage;
    const end = start + blogsPerPage;
    const blogContainer = document.getElementById('blog-container');
    blogContainer.innerHTML = '';
    typename = "0";
        switch (currentCategory){
            case "all":
                typename = "全部";
                break;
                case "cpp":
                typename = "C++";
                break;
                case "csharp":
                typename = "C#";
                break;
                case "python":
                typename = "Python";
                break;
                case "none":
                typename = "不分語言類";
                break;
        }

    if (filteredBlogs.length === 0) {
       
            blogContainer.innerHTML = `
                <h1 style="background-color:gray;">篩選: ${typename}</h1> <p>暫無該分類的文章!</p>
            `;
        
    } else {
        
        blogContainer.innerHTML = `
        <h1 style="background-color:gray;">篩選: ${typename}</h1>
    `;

        filteredBlogs.slice(start, end).forEach(blog => {
            const blogPost = document.createElement('div');
            blogPost.className = 'blog-post';
            blogPost.innerHTML = `
                <h2><a href="${blog.link}" target="_blank">${blog.title}</h2>
                <p>${blog.desc}</p>
                <img src="${blog.img}" alt="${blog.title}圖片" width="500" height="281"></a>
                
            `;
            blogContainer.appendChild(blogPost);
        });
    }

    document.getElementById('page-info').textContent = `第 ${page} 頁 / 共 ${Math.ceil(filteredBlogs.length / blogsPerPage)} 頁`;
    document.getElementById('prev-page').disabled = page === 1;
    document.getElementById('next-page').disabled = page === Math.ceil(filteredBlogs.length / blogsPerPage) || filteredBlogs.length === 0;
}

    document.getElementById('page-info').textContent = `第 ${page} 頁 / 共 ${Math.ceil(filteredBlogs.length / blogsPerPage)} 頁`;
    document.getElementById('prev-page').disabled = page === 1;
    document.getElementById('next-page').disabled = page === Math.ceil(filteredBlogs.length / blogsPerPage);


function changePage(direction) {
    currentPage += direction;
    displayBlogs(currentPage);
}

function filterBlogs(category) {
    currentCategory = category;
    currentPage = 1; // 重置為第1頁
    displayBlogs(currentPage);

    const buttons = document.querySelectorAll('#filter-buttons button');
    buttons.forEach(button => {
        button.classList.remove('active');
        if (button.textContent === category.toUpperCase() || (category === 'all' && button.textContent === '全部')) {
            button.classList.add('active');
        } 
        if (button.textContent === category.toUpperCase() || (category === 'cpp' && button.textContent === 'C++')) {
            button.classList.add('active');
        } 
        if (button.textContent === category.toUpperCase() || (category === 'csharp' && button.textContent === 'C#')) {
            button.classList.add('active');
        } 
        if (button.textContent === category.toUpperCase() || (category === 'python' && button.textContent === 'Python')) {
            button.classList.add('active');
        } 
        if (button.textContent === category.toUpperCase() || (category === 'none' && button.textContent === '不分語言')) {
            button.classList.add('active');
        } 
        
    });
}

document.addEventListener('DOMContentLoaded', () => {
    displayBlogs(currentPage);
});







