let blogsPerPage;
let currentPage = 1;
let currentCategory = 'all';
let searchKeyword = '';
let scartching = false;
let scartchingkw='';
updateActiveFilterButton(currentCategory);
blogs.reverse();

function isMobile() {
    return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}
if (isMobile()) {
    blogsPerPage = 3;
} else {
    blogsPerPage = 4;
}


document.addEventListener('DOMContentLoaded', () => {
displayBlogs(currentPage);

gsap.registerPlugin(ScrollTrigger);


gsap.utils.toArray(".section-fade").forEach(section => {
gsap.fromTo(section, 
    {
        opacity: 0, // 起始透明度
        y: 30       // 起始位置
        
    }, 
    {
        opacity: 1, // 最終透明度
        y: 0,       
        duration: 0.5,
        scrollTrigger: {
            trigger: section,
            start: "top bottom-=100", 
            end: "bottom top",       
            toggleActions: "play reverse play reverse", 
            markers: false  
        }
    }
    
);
});


});


function displayBlogs(page) {
    const filteredBlogs = blogs.filter(blog => 
        (currentCategory === 'all' || blog.category === currentCategory) &&
        (blog.title.toLowerCase().includes(searchKeyword) || blog.desc.toLowerCase().includes(searchKeyword))
    );
    const start = (page - 1) * blogsPerPage;
    const end = start + blogsPerPage;
    const blogContainer = document.getElementById('blog-container');
    blogContainer.innerHTML = '';
    const sh = document.getElementById('sc');
    sh.innerHTML = '';
    let typename = getTypeName(currentCategory);

    if (filteredBlogs.length === 0) {
        blogContainer.innerHTML = `
            <h3 class="filter-info">篩選: ${typename}</h3>
            <p class="no-posts">暫無該分類的文章!</p><br>
        `;
        if(scartching === true){
            blogContainer.innerHTML = `
            <h3 class="filter-info">搜尋: ${scartchingkw} / 篩選: ${typename} (${filteredBlogs.length})</h3>
             <p class="no-posts">找不到文章 請變更關鍵字或分類!</p><br>
        `;
        sh.innerHTML = `
            
                <button id="clear-button" onclick="clearInput()" style="transform: translateX(20px); ">刪除關鍵字</button>
        `;
        }
    } else {
        blogContainer.innerHTML = `
            <h3 class="filter-info">篩選: ${typename} (${filteredBlogs.length})</h3>
            
        `;
        sh.innerHTML = `
                            
        `;
        if(scartching === true){
            blogContainer.innerHTML = `
            <h3 class="filter-info">搜尋: ${scartchingkw} / 篩選: ${typename} (${filteredBlogs.length})</h3>
        `;
        sh.innerHTML = `
            
                <button id="clear-button" onclick="clearInput()" style="transform: translateX(20px); ">刪除關鍵字</button>
        `;
        }
        else{
            sh.innerHTML = `
            
                
        `;
        }
        filteredBlogs.slice(start, end).forEach((blog, index) => {
            const blogPost = document.createElement('div');
            blogPost.className = 'blog-post';
            blogPost.innerHTML = `
                <a href="${blog.link}" class="blog-link">
                    <div class="blog-image" style="background-image: url('${blog.img}')"></div>
                    <div class="blog-content">
                        <h3>${blog.title}</h3>
                        <p>${blog.desc}</p>
                    </div>
                </a>
            `;
            blogContainer.appendChild(blogPost);
            gsap.fromTo(blogPost, {
                duration: 0.7,
                opacity: 0,
                y: 80,
                
                trigger: blogPost,
                start: "top bottom-=100",
                toggleActions: "play none none reverse"
                
            },
            {
                opacity: 1,
                y: 0,
            }
            
            
            
            );
            blogPost.addEventListener('mouseenter', () => {
                gsap.to(blogPost, {
                    y: -15, // 當懸停時移動 -20px
                    boxShadow: '0 5px 25px rgba(255,255,255,0.5)', // 加入陰影
                    duration: 0.3
                });
            });
            
            blogPost.addEventListener('mouseleave', () => {
                gsap.to(blogPost, {
                    y: 0, // 恢復原來的位置
                    boxShadow: '0 0 15px rgba(255, 255, 255, 0.15)', // 移除陰影
                    duration: 0.3
                });
            });
            
           
        });
        if(!isMobile()){
        const actualPosts = filteredBlogs.slice(start, end).length;
        const neededPlaceholders = blogsPerPage - actualPosts;

        for (let i = 0; i < neededPlaceholders; i++) {
            const placeholder = document.createElement('div');
            placeholder.className = 'blog-post blog-placeholder'; //  CSS 隱藏
            blogContainer.appendChild(placeholder);
        }
            }
        }
    

    updatePagination(page, Math.ceil(filteredBlogs.length / blogsPerPage));
}

function updatePagination(currentPage, totalPages) {
    document.getElementById('page-info').textContent = `第 ${currentPage} 頁 / 共 ${totalPages} 頁`;
    document.getElementById('prev-page').disabled = currentPage === 1;
    document.getElementById('next-page').disabled = currentPage === totalPages || totalPages === 0;
}

function changePage(direction) {
    currentPage += direction;
    displayBlogs(currentPage);
}

function filterBlogs(category) {
    currentCategory = category;
    currentPage = 1;
    displayBlogs(currentPage);
    updateActiveFilterButton(category);
}

function updateActiveFilterButton(category) {
    const buttons = document.querySelectorAll('#filter-buttons button');
    buttons.forEach(button => {
        button.classList.remove('active');
        if (button.textContent.toLowerCase() === getTypeName(category).toLowerCase()) {
            button.classList.add('active');
        }
    });
}

function getTypeName(category) {
    switch (category) {
        case 'all': return '全部';
        case 'cpp': return 'C++';
        case 'csharp': return 'C#';
        case 'python': return 'Python';
        case 'none': return '不分語言';
        default: return category;
    }
}
function clearInput(){
    document.getElementById('search-input').value = '';
    searchBlogs();
}
function searchBlogs() {
    scartchingkw = document.getElementById('search-input').value;
    searchKeyword = scartchingkw.toLowerCase();
    if(searchKeyword .trim() === ""){
        scartching = false;
        currentPage = 1;
    }
    else{
        scartching = true;
        currentPage = 1;
       
    }
    
    
    
    displayBlogs(currentPage);
    
    
}



    

    gsap.to(".parallax-section", {
        backgroundPosition: "50% 100%",
        ease: "none",
        scrollTrigger: {
            trigger: ".parallax-section",
            start: "top top",
            end: "bottom top",
            scrub: true
        }
    });

    const navItems = document.querySelectorAll('nav ul li a');
    navItems.forEach(item => {
        item.addEventListener('mouseenter', () => {
            gsap.to(item, {scale: 1.1, duration: 0.3});
        });
        item.addEventListener('mouseleave', () => {
            gsap.to(item, {scale: 1, duration: 0.3});
        });
    });

    document.getElementById('search-button').addEventListener('click', searchBlogs);
    document.getElementById('search-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchBlogs();
        }
    });
