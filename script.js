const blogsPerPage = 5; // 每頁顯示的網誌數量
let currentPage = 1;
let currentCategory = 'all'; // 當前選擇的分類

function displayBlogs(page) {
    const filteredBlogs = blogs.filter(blog => currentCategory === 'all' || blog.category === currentCategory);
    const start = (page - 1) * blogsPerPage;
    const end = start + blogsPerPage;
    const blogContainer = document.getElementById('blog-container');
    blogContainer.innerHTML = '';
    let typename = '';

    switch (currentCategory) {
        case 'all':
            typename = '全部';
            break;
        case 'cpp':
            typename = 'C++';
            break;
        case 'csharp':
            typename = 'C#';
            break;
        case 'python':
            typename = 'Python';
            break;
        case 'none':
            typename = '不分語言類';
            break;
    }

    if (filteredBlogs.length === 0) {
        blogContainer.innerHTML = `
            <h1 style="background-color:gray;">篩選: ${typename}</h1> <p>暫無該分類的文章!</p>
        `;
    } else {
        blogContainer.innerHTML = `
            <h1 style="background-color:gray;">篩選: ${typename} (${filteredBlogs.length})</h1>
        `;
        
        filteredBlogs.reverse(); // 最新在上面

        filteredBlogs.slice(start, end).forEach(blog => {
            const blogPost = document.createElement('div');
            blogPost.className = 'blog-post';
            blogPost
            blogPost.innerHTML = `
                <h2><a href="${blog.link}" target="_blank">${blog.title}</h2>
                <p>${blog.desc}</p>
                <img src="${blog.img}" alt="${blog.title}圖片" width="500" height="281"></a>
            `;
            blogContainer.appendChild(blogPost);
        });

        // 重新观察新加载的 .blog-post 元素
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target); // 一次性动画，不再观察
                }
            });
        }, {
            threshold: 0.7 // 元素至少有10%可见时触发
        });

        // 观察所有 .blog-post 元素
        const blogPosts = document.querySelectorAll('.blog-post');
        blogPosts.forEach(post => {
            observer.observe(post);
        });
    }

    document.getElementById('page-info').textContent = `第 ${page} 頁 / 共 ${Math.ceil(filteredBlogs.length / blogsPerPage)} 頁`;
    document.getElementById('prev-page').disabled = page === 1;
    document.getElementById('next-page').disabled = page === Math.ceil(filteredBlogs.length / blogsPerPage) || filteredBlogs.length === 0;
}

function changePage(direction) {
    currentPage += direction;
    displayBlogs(currentPage);
}

function filterBlogs(category) {
    currentCategory = category;
    currentPage = 1; // 重置为第1页
    displayBlogs(currentPage);

    const buttons = document.querySelectorAll('#filter-buttons button');
    buttons.forEach(button => {
        button.classList.remove('active');
        if (button.textContent.toLowerCase() === category.toLowerCase() || 
            (category === 'all' && button.textContent === '全部') ||
            (category === 'cpp' && button.textContent === 'C++') ||
            (category === 'csharp' && button.textContent === 'C#') ||
            (category === 'python' && button.textContent === 'Python') ||
            (category === 'none' && button.textContent === '不分語言')) {
            button.classList.add('active');
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    displayBlogs(currentPage);
    // Get the checkbox and add an event listener
    

    
   
});


// Function to change the CSS file
function changeCSS(cssFile) {
    var link = document.querySelector("link[rel=stylesheet]");
    link.setAttribute("href", cssFile);
}
