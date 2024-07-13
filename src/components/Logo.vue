<template>
    <div class="logo">
        <a href="https://github.com/joo1es/svg2vue-ol" target="_blank">
            <img src="/logo.png" >
            <span class="logo-svg">SVG<small>2</small><span class="logo-vue">VUE</span></span>
        </a>
    </div>
</template>

<style lang="scss" scoped>
.logo {
    color: #333;
    font-size: 24px;
    font-family: Impact;
    a {
        color: #333;
        text-decoration: none;
        display: flex;
        align-items: center;
        letter-spacing: 1px;
        transition: .2s;
        &:hover {
            filter: brightness(1.2);
        }
    }
    img {
        width: 32px;
        margin-right: 10px
    }
    small {
        font-size: 16px;
    }
}
.logo-vue {
    color: #40ab7f;
}
</style>